// src/app/api/ai/generate-multi/route.ts
// 복수 설계안 생성 API - 3가지 타입별 교육과정 동시 생성

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { incrementAIUsage, createCourse } from '@/lib/db/queries'
import {
  generateMultipleCourses,
  generateSingleCourse,
  MultiCourseRequest,
  CourseType,
  COURSE_TYPES,
} from '@/lib/ai/multi-generator'

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
      singleType,  // 단일 타입만 생성할 경우
    } = body

    // 필수 필드 검증
    if (!target || !subject || !sessions || !duration) {
      return NextResponse.json({
        error: 'target, subject, sessions, duration are required',
      }, { status: 400 })
    }

    const courseRequest: MultiCourseRequest = {
      target,
      subject,
      sessions: parseInt(sessions),
      duration: parseInt(duration),
      goals: goals || [],
      tools: tools || [],
      constraints,
    }

    console.log('📝 복수 설계안 생성 요청:', courseRequest)

    if (singleType && COURSE_TYPES[singleType as CourseType]) {
      // 단일 타입 생성
      console.log(`🎯 단일 타입(${singleType}) 생성 시작...`)
      const result = await generateSingleCourse(courseRequest, singleType as CourseType)

      // AI 사용량 증가 (성공 후)
      await incrementAIUsage(user.uid)

      return NextResponse.json({
        success: true,
        mode: 'single',
        result,
      })
    }

    // 3가지 타입 동시 생성
    console.log('🚀 3가지 타입 동시 생성 시작...')
    const result = await generateMultipleCourses(courseRequest)

    // AI 사용량 증가 (성공 후)
    await incrementAIUsage(user.uid)

    console.log('✅ 생성 완료:', {
      types: result.courses.map(c => c.type),
      recommended: result.comparison.recommendedType,
      timeMs: result.metadata.generationTimeMs,
    })

    return NextResponse.json({
      success: true,
      mode: 'multi',
      courses: result.courses,
      comparison: result.comparison,
      metadata: result.metadata,
    })
  } catch (error: any) {
    console.error('❌ 복수 설계안 생성 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}

// GET: 타입 정보 조회
export async function GET() {
  return NextResponse.json({
    types: Object.values(COURSE_TYPES),
  })
}
