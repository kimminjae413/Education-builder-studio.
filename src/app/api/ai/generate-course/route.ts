// src/app/api/ai/generate-course/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 프로필 조회 (랭크별 AI 사용 제한 확인)
    const { data: profile } = await supabase
      .from('profiles')
      .select('rank, ai_usage_count_this_month')
      .eq('id', user.id)
      .single()

    // AI 사용 제한 확인
    const aiLimits: Record<string, number | null> = {
      newcomer: 10,
      junior: 30,
      intermediate: 100,
      senior: null,
      veteran: null,
      master: null,
    }

    const limit = aiLimits[profile?.rank || 'newcomer']
    if (limit !== null && (profile?.ai_usage_count_this_month || 0) >= limit) {
      return NextResponse.json(
        { error: `이번 달 AI 사용 횟수를 초과했습니다 (${limit}회 제한)` },
        { status: 429 }
      )
    }

    // 요청 바디 파싱
    const body = await request.json()
    const {
      targetAudience,
      subject,
      tools,
      duration,
      sessionCount,
      knowledgeGoals,
      skillGoals,
      attitudeGoals,
      lectureRatio,
      practiceRatio,
      projectRatio,
    } = body

    // 시드 데이터 조회 (AI가 참고할 검증된 자료)
    const { data: seedMaterials } = await supabase
      .from('teaching_materials')
      .select('title, description, target_category, subject_category, learning_objectives')
      .eq('is_seed_data', true)
      .eq('status', 'approved')
      .limit(5)

    // 시드 데이터 컨텍스트 생성
    let seedContext = ''
    if (seedMaterials && seedMaterials.length > 0) {
      seedContext = '\n\n참고할 검증된 교육 자료:\n'
      seedMaterials.forEach((material, index) => {
        seedContext += `\n[자료 ${index + 1}] ${material.title}`
        if (material.description) seedContext += `\n설명: ${material.description}`
        if (material.learning_objectives) seedContext += `\n목표: ${material.learning_objectives}`
      })
      seedContext += '\n\n위 자료들의 구조와 방식을 참고하되, 사용자의 요구사항에 맞게 새로운 과정을 설계하세요.'
    }

    // Gemini 프롬프트 생성
    const prompt = `당신은 10년 이상 경력의 교육과정 설계 전문가입니다.
다음 요구사항에 맞는 체계적인 교육과정을 설계해주세요.

**기본 정보:**
- 대상: ${targetAudience}
- 주제: ${subject}
- 사용 도구: ${tools.join(', ')}
- 수업 시간: ${duration}분
- 차시: ${sessionCount}차시

**학습 목표:**
- 지식 목표: ${knowledgeGoals.join(', ')}
- 기능 목표: ${skillGoals.join(', ')}
- 태도 목표: ${attitudeGoals.join(', ')}

**교수 방법 비율:**
- 강의: ${lectureRatio}%
- 실습: ${practiceRatio}%
- 프로젝트: ${projectRatio}%
${seedContext}

**출력 형식 (반드시 아래 JSON 형식으로 응답):**
{
  "title": "과정 제목 (명확하고 매력적)",
  "overview": "과정 전체 개요 (2-3문장)",
  "sessions": [
    {
      "session_number": 1,
      "title": "차시 제목",
      "duration": ${duration},
      "objectives": ["목표1", "목표2"],
      "activities": [
        {
          "type": "강의|실습|프로젝트",
          "duration": 20,
          "title": "활동 제목",
          "description": "활동 내용",
          "materials": ["필요 자료1", "필요 자료2"]
        }
      ],
      "assessment": ["평가 방법1", "평가 방법2"]
    }
  ],
  "overall_materials": ["전체 과정에 필요한 자료들"],
  "tips": ["강사를 위한 팁들"]
}

**중요:**
1. 대상 연령/수준에 맞는 난이도로 설계
2. 실제 수업에서 바로 사용 가능하도록 구체적으로 작성
3. 각 활동의 시간 배분이 정확하게 ${duration}분이 되도록 조정
4. 학습 목표가 활동을 통해 달성될 수 있도록 설계
5. 반드시 유효한 JSON 형식으로만 응답 (코드 블록이나 추가 설명 없이)`

    // Gemini API 호출
    const startTime = Date.now()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const generationTime = Date.now() - startTime

    // JSON 파싱
    let courseData
    try {
      // 코드 블록 제거 (```json ... ``` 형식일 경우)
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      courseData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('AI Response:', text)
      return NextResponse.json(
        { error: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // DB에 저장
    const { data: course, error: dbError } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        title: courseData.title,
        target_audience: targetAudience,
        subject: subject,
        tools: tools,
        duration: duration,
        session_count: sessionCount,
        knowledge_goals: knowledgeGoals,
        skill_goals: skillGoals,
        attitude_goals: attitudeGoals,
        lecture_ratio: lectureRatio,
        practice_ratio: practiceRatio,
        project_ratio: projectRatio,
        ai_generated_content: courseData,
        lesson_plan: courseData.overview,
        activities: courseData.sessions,
        materials_needed: courseData.overall_materials,
        ai_model_used: 'gemini-1.5-pro',
        ai_prompt_used: prompt,
        generation_time_ms: generationTime,
        status: 'completed',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: '과정 저장에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course,
      generationTime,
    })

  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error.message || '과정 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
