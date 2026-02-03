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

    // Check environment variable status
    const envCheck = {
      hasServiceAccountKey: !!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY,
      keyLength: process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY?.length || 0,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      code: error.code || 'unknown',
      envCheck,
    }, { status: 401 })
  }
}

// GET for simple test
export async function GET() {
  const envCheck = {
    hasServiceAccountKey: !!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY,
    keyLength: process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY?.length || 0,
    hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }

  return NextResponse.json({ status: 'ok', envCheck })
}
