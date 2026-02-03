import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {}

  // 1. 환경 변수 확인
  results.hasServiceAccountKey = !!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  results.keyLength = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY?.length || 0

  // 2. Admin SDK 초기화 테스트
  try {
    const auth = getAdminAuth()
    results.adminInitialized = true
    results.authAppName = auth.app.name
  } catch (e: any) {
    results.adminInitialized = false
    results.adminError = e.message
  }

  // 3. 토큰 검증 테스트 (Authorization 헤더가 있으면)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    results.tokenReceived = true
    results.tokenLength = token.length

    try {
      const auth = getAdminAuth()
      const decoded = await auth.verifyIdToken(token)
      results.tokenValid = true
      results.uid = decoded.uid
      results.email = decoded.email
    } catch (e: any) {
      results.tokenValid = false
      results.tokenError = e.message
      results.tokenErrorCode = e.code
    }
  } else {
    results.tokenReceived = false
  }

  return NextResponse.json(results)
}
