// src/app/api/ai/generate-course/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Netlify Functions 타임아웃 설정
export const maxDuration = 30
export const dynamic = 'force-dynamic'

// ⭐ 관련 자료 검색 함수 (NEW)
async function findRelatedMaterials(
  supabase: any,
  courseData: any,
  targetAudience: string,
  subject: string
) {
  try {
    // 1. 설계안 내용을 텍스트로 변환
    const searchText = `
${courseData.title}
${courseData.overview}
대상: ${targetAudience}
주제: ${subject}
${courseData.sessions?.map((s: any) => s.title).join(' ')}
    `.trim()

    console.log('🔍 관련 자료 검색 시작...')

    // 2. 임베딩 생성
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(searchText)
    const queryEmbedding = result.embedding.values

    // 3. 벡터 검색 (유사도 0.7 이상, 최대 5개)
    const { data: materials, error } = await supabase.rpc('match_materials', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5
    })

    if (error) {
      console.error('❌ 벡터 검색 에러:', error)
      return []
    }

    console.log(`✅ 관련 자료 ${materials?.length || 0}개 발견`)
    return materials || []

  } catch (error) {
    console.error('❌ 관련 자료 검색 실패:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 프로필 조회
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

    // 시드 데이터 조회 (3개로 축소)
    const { data: seedMaterials } = await supabase
      .from('teaching_materials')
      .select('title, description, target_category, subject_category')
      .eq('is_seed_data', true)
      .eq('status', 'approved')
      .limit(3)

    // 시드 데이터 컨텍스트 생성
    let seedContext = ''
    if (seedMaterials && seedMaterials.length > 0) {
      seedContext = '\n\n참고 자료:\n'
      seedMaterials.forEach((m, i) => {
        seedContext += `${i + 1}. ${m.title}\n`
      })
    }

    // Gemini 프롬프트
    const prompt = `당신은 교육과정 설계 전문가입니다.

대상: ${targetAudience}
주제: ${subject}
도구: ${tools.join(', ')}
시간: ${duration}분 × ${sessionCount}차시

목표:
- 지식: ${knowledgeGoals.join(', ')}
- 기능: ${skillGoals.join(', ')}
- 태도: ${attitudeGoals.join(', ')}

방법: 강의 ${lectureRatio}%, 실습 ${practiceRatio}%, 프로젝트 ${projectRatio}%
${seedContext}

JSON 형식으로 출력:
{
  "title": "과정명",
  "overview": "개요 (2문장)",
  "sessions": [
    {
      "session_number": 1,
      "title": "차시명",
      "duration": ${duration},
      "objectives": ["목표1", "목표2"],
      "activities": [
        {
          "type": "강의|실습|프로젝트",
          "duration": 20,
          "title": "활동명",
          "description": "내용",
          "materials": ["자료1"]
        }
      ],
      "assessment": ["평가1"]
    }
  ],
  "overall_materials": ["전체 자료"],
  "tips": ["팁1"]
}

중요: 유효한 JSON만 출력, 코드블록 사용 금지`

    // Gemini API 호출
    const startTime = Date.now()
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      }
    })
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const generationTime = Date.now() - startTime
    console.log(`⏱️ AI 생성 시간: ${generationTime}ms`)

    // JSON 파싱
    let courseData
    try {
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      courseData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('AI Response:', text.substring(0, 500))
      return NextResponse.json(
        { error: 'AI 응답 파싱 실패. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // ⭐ 관련 자료 검색 (NEW)
    const recommendedMaterials = await findRelatedMaterials(
      supabase,
      courseData,
      targetAudience,
      subject
    )

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
        activities: courseData.sessions || [],
        materials_needed: courseData.overall_materials,
        ai_model_used: 'gemini-2.0-flash-exp',
        ai_prompt_used: prompt,
        generation_time_ms: generationTime,
        status: 'completed',
        recommended_materials: recommendedMaterials.map((m: any) => m.id), // ⭐ 추가
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: '과정 저장 실패' },
        { status: 500 }
      )
    }

    // AI 사용 횟수 증가
    await supabase
      .from('profiles')
      .update({
        ai_usage_count_this_month: (profile?.ai_usage_count_this_month || 0) + 1
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      course,
      generationTime,
      recommendedMaterials, // ⭐ 프론트엔드로 전달
    })

  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error.message || '과정 생성 실패' },
      { status: 500 }
    )
  }
}
