// src/app/api/ai/generate-course/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getProfile, createCourse, incrementAIUsage, createCitation, incrementDocumentReferenceCount } from '@/lib/db/queries'
import { buildRAGContext, RAGContext } from '@/lib/rag/retriever'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Netlify Functions 타임아웃 설정
export const maxDuration = 30
export const dynamic = 'force-dynamic'

/**
 * RAG 기반 관련 자료 검색
 * 벡터 유사도 검색을 사용하여 관련 자료 찾기
 */
async function findRelatedMaterialsWithRAG(
  targetAudience: string,
  subject: string,
  tools: string[],
  goals: string[]
): Promise<{ context: RAGContext | null; query: string }> {
  try {
    // 검색 쿼리 구성
    const query = [
      `대상: ${targetAudience}`,
      `주제: ${subject}`,
      `도구: ${tools.join(', ')}`,
      `목표: ${goals.join(', ')}`,
    ].join('\n')

    console.log('🔍 RAG 검색 쿼리:', query.substring(0, 100) + '...')

    // RAG 컨텍스트 구성
    const context = await buildRAGContext(query, {
      topK: 10,
      minScore: 0.5,
      maxTokens: 4000,
    })

    console.log(`✅ RAG 검색 완료: ${context.results.length}개 청크, ${context.sources.length}개 문서`)

    return { context, query }
  } catch (error) {
    console.error('❌ RAG 검색 실패:', error)
    return { context: null, query: '' }
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

    // 모든 목표 합치기
    const allGoals = [...(knowledgeGoals || []), ...(skillGoals || []), ...(attitudeGoals || [])]

    // RAG 기반 관련 자료 검색
    const { context: ragContext } = await findRelatedMaterialsWithRAG(
      targetAudience,
      subject,
      tools || [],
      allGoals
    )

    // RAG 컨텍스트 프롬프트 구성
    let ragPromptSection = ''
    if (ragContext && ragContext.results.length > 0) {
      ragPromptSection = `

[베테랑 강사들의 검증된 참고 자료]
다음은 비슷한 교육을 진행한 경험 많은 강사들의 자료입니다. 이 자료들을 참고하여 교육과정을 설계해주세요:

${ragContext.contextText}

위 참고 자료를 바탕으로 실제 교육 현장에서 검증된 내용을 반영해주세요.`
    }

    // Gemini 프롬프트
    const prompt = `당신은 10년 이상 경력의 교육과정 설계 전문가입니다. 실제 교육 현장에서 바로 사용할 수 있는 상세하고 구체적인 교육과정을 설계해주세요.

## 교육과정 요청 정보
- 교육 대상: ${targetAudience}
- 주제: ${subject}
- 사용 도구/교구: ${(tools || []).join(', ')}
- 수업 시간: ${duration}분 × ${sessionCount}차시

## 학습 목표
- 지식 목표: ${(knowledgeGoals || []).join(', ')}
- 기능 목표: ${(skillGoals || []).join(', ')}
- 태도 목표: ${(attitudeGoals || []).join(', ')}

## 교수 방법 비율
강의(이론 설명) ${lectureRatio}% / 실습(따라하기) ${practiceRatio}% / 프로젝트(창작) ${projectRatio}%
${ragPromptSection}

## 작성 지침
1. 각 활동의 description은 최소 3문장 이상으로 구체적으로 작성하세요. 강사가 바로 수업할 수 있도록 진행 방법, 핵심 질문, 유의사항을 포함하세요.
2. overview는 교육과정의 전체 흐름과 기대 효과를 5문장 이상으로 상세히 설명하세요.
3. 각 차시별 활동은 최소 4개 이상 포함하세요. 도입-전개-정리-평가 흐름으로 구성하세요.
4. 각 활동의 시간 합이 차시당 시간(${duration}분)과 정확히 일치해야 합니다.
5. materials는 구체적인 준비물 목록을 상세하게 작성하세요 (예: "아두이노 UNO R3 보드", "온도 센서(DHT11)" 등).
6. assessment는 차시별 3개 이상의 평가 항목을 포함하세요.
7. tips는 실제 수업 운영 시 유용한 노하우를 5개 이상 작성하세요.
8. overall_materials는 전체 과정에 필요한 모든 준비물을 빠짐없이 나열하세요.
9. ${targetAudience} 수준에 맞는 용어와 난이도로 작성하세요.

## 출력 JSON 형식
{
  "title": "창의적이고 매력적인 과정명",
  "overview": "교육과정의 전체 흐름, 학습 목표 달성 방법, 기대 효과를 5문장 이상으로 상세히 설명",
  "sessions": [
    {
      "session_number": 1,
      "title": "흥미를 끄는 차시명",
      "duration": ${duration},
      "objectives": ["구체적인 학습목표1 (행동 동사 사용)", "구체적인 학습목표2"],
      "activities": [
        {
          "type": "강의|실습|프로젝트",
          "duration": 10,
          "title": "활동명",
          "description": "3문장 이상의 상세한 활동 설명. 진행 방법, 핵심 질문, 유의사항을 포함.",
          "materials": ["구체적인 준비물1", "준비물2"]
        }
      ],
      "assessment": ["평가항목1", "평가항목2", "평가항목3"]
    }
  ],
  "overall_materials": ["전체 과정 준비물 상세 목록"],
  "tips": ["강사를 위한 실전 팁 5개 이상"]
}

중요: 유효한 JSON만 출력하세요. 코드블록(\`\`\`)이나 다른 텍스트 없이 순수 JSON만 출력하세요.`

    // Gemini API 호출
    const startTime = Date.now()
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 16384,
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

    // 추천 자료 목록 구성
    const recommendedMaterials = ragContext?.sources.map(source => ({
      id: source.documentId,
      title: source.documentTitle,
      chunkCount: source.chunkCount,
    })) || []

    // DB에 저장
    let course
    try {
      course = await createCourse({
        user_id: user.uid,
        title: courseData.title,
        target_audience: targetAudience,
        subject: subject,
        tools: tools || [],
        duration: duration,
        session_count: sessionCount,
        knowledge_goals: knowledgeGoals || [],
        skill_goals: skillGoals || [],
        attitude_goals: attitudeGoals || [],
        lecture_ratio: lectureRatio,
        practice_ratio: practiceRatio,
        project_ratio: projectRatio,
        ai_generated_content: courseData,
        lesson_plan: courseData.overview,
        activities: courseData.sessions || [],
        materials_needed: courseData.overall_materials,
        ai_model_used: 'gemini-2.0-flash',
        ai_prompt_used: process.env.NODE_ENV === 'production' ? undefined : prompt,
        generation_time_ms: generationTime,
        status: 'completed',
        recommended_materials: recommendedMaterials.map((m) => m.id),
      })
    } catch (dbError) {
      console.error('DB 저장 실패:', dbError)
      return NextResponse.json(
        { error: 'AI 생성은 성공했으나 저장에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // RAG 인용 기록 및 참조 카운트 증가 (리워드 시스템용)
    if (ragContext && ragContext.results.length > 0) {
      const processedDocuments = new Set<string>()

      for (const ragResult of ragContext.results) {
        try {
          // 인용 기록 저장
          await createCitation({
            course_id: course.id,
            chunk_id: ragResult.chunkId,
            document_id: ragResult.documentId,
            relevance_score: ragResult.score,
            cited_in_output: true,
          })

          // 문서별로 한 번만 참조 카운트 증가
          if (!processedDocuments.has(ragResult.documentId)) {
            await incrementDocumentReferenceCount(ragResult.documentId)
            processedDocuments.add(ragResult.documentId)
          }
        } catch (citationError) {
          console.error('인용 기록 저장 실패:', citationError)
        }
      }
    }

    // AI 사용 횟수 증가 - 모든 과정이 성공한 후에만 카운팅
    await incrementAIUsage(user.uid)

    return NextResponse.json({
      success: true,
      course,
      generationTime,
      recommendedMaterials,
      ragStats: ragContext ? {
        chunksUsed: ragContext.results.length,
        documentsReferenced: ragContext.sources.length,
        totalTokens: ragContext.totalTokens,
      } : null,
    })
  } catch (error: unknown) {
    // 여기 도달 = AI 호출 자체 실패 등 → 카운팅 없음
    console.error('AI generation error:', error)
    const message = process.env.NODE_ENV === 'production' ? '과정 생성 실패' : (error instanceof Error ? error.message : '과정 생성 실패')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
