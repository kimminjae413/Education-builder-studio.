// src/app/api/ai/feedback/route.ts
// 코스 피드백 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import {
  saveFeedback,
  generateFeedbackHints,
  CourseFeedback,
} from '@/lib/ai/feedback-system'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      courseId,
      rating,
      usefulSections,
      improvementAreas,
      selectedType,
      comment,
    } = body

    if (!courseId || !rating) {
      return NextResponse.json({
        error: 'courseId and rating are required',
      }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({
        error: 'rating must be between 1 and 5',
      }, { status: 400 })
    }

    const feedback: CourseFeedback = {
      courseId,
      userId: user.uid,
      rating,
      usefulSections: usefulSections || [],
      improvementAreas: improvementAreas || [],
      selectedType,
      comment,
    }

    console.log('📝 피드백 저장:', { courseId, rating, userId: user.uid })

    const result = await saveFeedback(feedback)

    return NextResponse.json({
      success: true,
      feedbackId: result.id,
    })
  } catch (error: any) {
    console.error('❌ 피드백 저장 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}

// GET: 사용자 피드백 힌트 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hints = await generateFeedbackHints(user.uid)

    return NextResponse.json({
      success: true,
      hints,
    })
  } catch (error: any) {
    console.error('❌ 피드백 힌트 조회 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}
