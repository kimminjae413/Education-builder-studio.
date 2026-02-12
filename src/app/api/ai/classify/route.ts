// src/app/api/ai/classify/route.ts
// 자료 자동 분류 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import {
  classifyDocument,
  classificationToText,
  MAIN_CATEGORIES,
  CONTENT_TYPES,
  GRADE_LEVELS,
} from '@/lib/ai/auto-classifier'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, fileName, useAI = true } = body

    if (!text) {
      return NextResponse.json({
        error: 'text is required',
      }, { status: 400 })
    }

    console.log('🔍 자료 분류 요청:', {
      textLength: text.length,
      fileName,
      useAI,
    })

    const result = await classifyDocument(text, { useAI, fileName })
    const textSummary = classificationToText(result)

    console.log('✅ 분류 완료:', {
      mainCategory: result.mainCategory,
      contentType: result.contentType,
      confidence: result.confidence,
      processingTimeMs: result.processingTimeMs,
    })

    return NextResponse.json({
      success: true,
      classification: result,
      textSummary,
    })
  } catch (error: any) {
    console.error('❌ 자료 분류 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}

// GET: 분류 카테고리 목록 조회
export async function GET() {
  return NextResponse.json({
    mainCategories: MAIN_CATEGORIES,
    contentTypes: CONTENT_TYPES,
    gradeLevels: GRADE_LEVELS,
  })
}
