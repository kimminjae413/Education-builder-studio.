import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

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

// GET for simple test and key format check
export async function GET() {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const key = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  let keyInfo: any = { hasKey: false }

  if (key) {
    keyInfo.hasKey = true
    keyInfo.keyLength = key.length

    try {
      const parsed = JSON.parse(key)
      keyInfo.jsonValid = true
      keyInfo.hasPrivateKey = !!parsed.private_key
      keyInfo.projectId = parsed.project_id
      keyInfo.clientEmail = parsed.client_email

      if (parsed.private_key) {
        const pk = parsed.private_key
        keyInfo.pkLength = pk.length
        keyInfo.pkStartsWith = pk.substring(0, 40)
        keyInfo.pkEndsWith = pk.substring(pk.length - 40)
        keyInfo.containsBackslashN = pk.includes('\\n')
        keyInfo.containsRealNewline = pk.includes('\n')
        keyInfo.newlineCount = (pk.match(/\n/g) || []).length
        keyInfo.backslashNCount = (pk.match(/\\n/g) || []).length
      }
    } catch (e: any) {
      keyInfo.jsonValid = false
      keyInfo.parseError = e.message
    }
  }

  return NextResponse.json({
    status: 'ok',
    envCheck: {
      hasServiceAccountKey: !!key,
      keyLength: key?.length || 0,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    keyInfo,
  })
}
