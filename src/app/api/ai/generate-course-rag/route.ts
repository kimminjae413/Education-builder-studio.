// src/app/api/ai/generate-course-rag/route.ts
// RAG 기반 교육과정 생성 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { incrementAIUsage, createCourse } from '@/lib/db/queries'
import {
  generateCourseWithRAG,
  generateCourseBasic,
  CourseRequest,
  saveRAGCitations,
} from '@/lib/rag/generator'
import { buildRAGContext } from '@/lib/rag/retriever'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청 파싱
    const body = await request.json()
    const {
      target,
      subject,
      sessions,
      duration,
      goals,
      tools,
      constraints,
      useRAG = true,  // RAG 사용 여부 (기본: true)
    } = body

    // 필수 필드 검증
    if (!target || !subject || !sessions || !duration) {
      return NextResponse.json({
        error: 'target, subject, sessions, duration are required',
      }, { status: 400 })
    }

    const courseRequest: CourseRequest = {
      target,
      subject,
      sessions: parseInt(sessions),
      duration: parseInt(duration),
      goals: goals || [],
      tools: tools || [],
      constraints,
    }

    console.log('📝 교육과정 생성 요청:', courseRequest)

    let result

    if (useRAG) {
      // RAG 기반 생성
      console.log('🔍 RAG 기반 생성 시작...')
      try {
        result = await generateCourseWithRAG(courseRequest)
      } catch (ragError) {
        console.error('RAG 생성 실패, 기본 생성으로 폴백:', ragError)
        result = await generateCourseBasic(courseRequest)
      }
    } else {
      // 기본 생성
      console.log('📝 기본 생성 시작...')
      result = await generateCourseBasic(courseRequest)
    }

    console.log('✅ 생성 완료:', {
      lessonPlans: result.lessonPlans.length,
      sources: result.sources.length,
      timeMs: result.metadata.generationTimeMs,
    })

    // AI 사용량 증가 (성공 후)
    await incrementAIUsage(user.uid)

    // 과정 저장
    const course = await createCourse({
      user_id: user.uid,
      title: `${subject} - ${target}`,
      target_audience: target,
      subject: subject,
      tools: tools || [],
      duration: duration,
      session_count: sessions,
      knowledge_goals: goals || [],
      skill_goals: [],
      attitude_goals: [],
      ai_generated_content: {
        proposal: result.proposal,
        lessonPlans: result.lessonPlans,
        summary: result.summary,
      },
      lesson_plan: result.proposal,
      activities: result.lessonPlans.flatMap(lp => lp.activities),
      ai_model_used: result.metadata.model,
      generation_time_ms: result.metadata.generationTimeMs,
      recommended_materials: result.sources.map(s => s.documentId),
      status: 'completed',
    })

    // RAG 인용 정보 저장
    if (useRAG && result.sources.length > 0) {
      const searchQuery = `${subject} ${target}`
      const ragContext = await buildRAGContext(searchQuery, { topK: 10 })
      await saveRAGCitations(course.id, ragContext)
    }

    return NextResponse.json({
      success: true,
      courseId: course.id,
      result: {
        proposal: result.proposal,
        lessonPlans: result.lessonPlans,
        summary: result.summary,
        sources: result.sources,
      },
      metadata: result.metadata,
    })
  } catch (error: any) {
    console.error('❌ 교육과정 생성 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}

// GET: RAG 컨텍스트만 검색 (테스트용)
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    console.log('🔍 RAG 검색 테스트:', query)

    const context = await buildRAGContext(query, {
      topK: 5,
      minScore: 0.3,
    })

    return NextResponse.json({
      query,
      results: context.results.map(r => ({
        documentTitle: r.documentTitle,
        score: r.score,
        contentPreview: r.content.substring(0, 200) + '...',
      })),
      sources: context.sources,
      totalTokens: context.totalTokens,
    })
  } catch (error: any) {
    console.error('❌ RAG 검색 오류:', error)
    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message }, { status: 500 })
  }
}
