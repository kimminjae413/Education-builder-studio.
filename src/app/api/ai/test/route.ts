// src/app/api/ai/test/route.ts
import { NextResponse } from 'next/server'
import { generateText, validateGeminiAPI } from '@/lib/ai/gemini'

export async function GET() {
  try {
    // 1. API 키 유효성 확인
    const isValid = await validateGeminiAPI()
    
    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gemini API 키가 유효하지 않습니다.' 
        },
        { status: 401 }
      )
    }

    // 2. 간단한 테스트 프롬프트
    const response = await generateText(
      '안녕하세요! 간단히 자기소개를 해주세요. (한 문장으로)'
    )

    return NextResponse.json({
      success: true,
      message: 'Gemini API 연결 성공! ✅',
      response: response,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Gemini Test Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'API 테스트 중 오류 발생' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt가 필요합니다.' },
        { status: 400 }
      )
    }

    const response = await generateText(prompt)

    return NextResponse.json({
      success: true,
      prompt: prompt,
      response: response,
    })
  } catch (error: any) {
    console.error('Gemini POST Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    )
  }
}
