// src/app/api/ai/generate-course/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getProfile, createCourse, incrementAIUsage, getApprovedSeedMaterials } from '@/lib/db/queries'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Netlify Functions 타임아웃 설정
export const maxDuration = 30
export const dynamic = 'force-dynamic'

// DB에서 관련 자료 검색 (키워드 기반)
async function findRelatedMaterials(
  courseData: { title: string; overview: string; sessions?: { title: string }[] },
  targetAudience: string,
  subject: string,
  tools: string[]
) {
  try {
    console.log('🔍 관련 자료 검색 시작...')

    // DB에서 시드 데이터 조회
    const seedMaterials = await getApprovedSeedMaterials(10)

    // 키워드 매칭으로 점수 계산
    const keywords = [
      ...subject.toLowerCase().split(' '),
      ...targetAudience.toLowerCase().split(' '),
      ...tools.map(t => t.toLowerCase()),
    ]

    const scored = seedMaterials.map(m => {
      let score = 0
      const titleLower = m.title.toLowerCase()
      const descLower = (m.description || '').toLowerCase()

      keywords.forEach(kw => {
        if (titleLower.includes(kw)) score += 2
        if (descLower.includes(kw)) score += 1
      })

      return { ...m, score }
    })

    // 점수순 정렬 후 상위 5개
    const topMaterials = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    console.log(`✅ 관련 자료 ${topMaterials.length}개 발견`)

    return topMaterials.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.description || '',
      uri: m.file_url,
      similarity: m.score,
    }))
  } catch (error) {
    console.error('❌ 자료 검색 실패:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 프로필 조회
    const profile = await getProfile(user.uid)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // AI 사용 제한 확인
    const aiLimits: Record<string, number | null> = {
      newcomer: 10,
      junior: 30,
      intermediate: 100,
      senior: null,
      veteran: null,
      master: null,
    }

    const limit = aiLimits[profile.rank || 'newcomer']
    if (limit !== null && (profile.ai_usage_count_this_month || 0) >= limit) {
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

    // 시드 데이터 조회 (RAG 컨텍스트용)
    const seedMaterials = await getApprovedSeedMaterials(3)

    // 시드 데이터 컨텍스트 생성
    let seedContext = ''
    if (seedMaterials.length > 0) {
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
      },
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

    // 관련 자료 검색 (Vertex AI Search)
    const recommendedMaterials = await findRelatedMaterials(
      courseData,
      targetAudience,
      subject,
      tools
    )

    // DB에 저장
    const course = await createCourse({
      user_id: user.uid,
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
      recommended_materials: recommendedMaterials.map((m) => m.id),
    })

    // AI 사용 횟수 증가
    await incrementAIUsage(user.uid)

    return NextResponse.json({
      success: true,
      course,
      generationTime,
      recommendedMaterials,
    })
  } catch (error: unknown) {
    console.error('AI generation error:', error)
    const message = error instanceof Error ? error.message : '과정 생성 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
