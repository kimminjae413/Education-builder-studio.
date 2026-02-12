import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })

    // 서버 사이드에서 쿠키 설정 (httpOnly로 XSS 공격 방어)
    response.cookies.set('firebase-token', token, {
      path: '/',
      maxAge: 60 * 60, // 1시간
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    })

    return response
  } catch (error) {
    console.error('Set token error:', error)
    return NextResponse.json({ error: 'Failed to set token' }, { status: 500 })
  }
}
