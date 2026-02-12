// src/app/api/ai/extract-constraints/route.ts
// 제약 조건 자동 추출 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import {
  extractConstraints,
  constraintsToText,
  constraintsToSearchFilter,
  ExtractedConstraints,
} from '@/lib/ai/constraint-extractor'

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
      goals,
      tools,
      duration,
      additionalInfo,
    } = body

    // 최소 하나의 입력 필요
    if (!target && !subject && !goals && !tools && !additionalInfo) {
      return NextResponse.json({
        error: 'At least one input field is required',
      }, { status: 400 })
    }

    console.log('🔍 제약조건 추출 요청:', { target, subject, goals, tools, duration })

    // 제약 조건 추출
    const constraints = await extractConstraints({
      target,
      subject,
      goals,
      tools,
      duration,
      additionalInfo,
    })

    // 텍스트 및 필터 변환
    const textSummary = constraintsToText(constraints)
    const searchFilter = constraintsToSearchFilter(constraints)

    console.log('✅ 추출 완료:', {
      confidence: constraints.confidence,
      fieldsExtracted: Object.keys(constraints).filter(k => {
        const v = constraints[k as keyof ExtractedConstraints]
        return v !== null && v !== undefined &&
               (Array.isArray(v) ? v.length > 0 : true)
      }).length,
    })

    return NextResponse.json({
      success: true,
      constraints,
      textSummary,
      searchFilter,
    })
  } catch (error: any) {
    console.error('❌ 제약조건 추출 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}

// GET: 샘플 추출 (테스트용)
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const text = searchParams.get('text')

    if (!text) {
      return NextResponse.json({
        error: 'Query parameter "text" is required',
        example: '/api/ai/extract-constraints?text=초등3학년 아두이노 4차시',
      }, { status: 400 })
    }

    console.log('🔍 제약조건 추출 테스트:', text)

    // 간단한 텍스트에서 추출
    const constraints = await extractConstraints({
      additionalInfo: text,
    })

    return NextResponse.json({
      input: text,
      constraints,
      textSummary: constraintsToText(constraints),
    })
  } catch (error: any) {
    console.error('❌ 테스트 추출 오류:', error)
    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message }, { status: 500 })
  }
}
