import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }

    const decodedToken = await verifyIdToken(token)

    return NextResponse.json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
    })
  } catch (error: any) {
    console.error('Token verification error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      code: error.code || 'unknown',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 401 })
  }
}
