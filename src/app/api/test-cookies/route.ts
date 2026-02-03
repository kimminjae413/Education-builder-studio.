import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile } from '@/lib/db/queries'

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    // 1. cookies() 테스트
    const cookieStore = await cookies()
    const token = cookieStore.get('firebase-token')?.value
    results.hasToken = !!token
    results.tokenLength = token?.length || 0

    if (!token) {
      results.error = 'No token in cookie'
      return NextResponse.json(results)
    }

    // 2. 토큰 검증 테스트
    try {
      const user = await verifyIdToken(token)
      results.verifySuccess = true
      results.uid = user.uid
      results.email = user.email

      // 3. 프로필 조회 테스트
      try {
        const profile = await getProfile(user.uid)
        results.profileFound = !!profile
        results.profileName = profile?.name
      } catch (e: any) {
        results.profileError = e.message
      }
    } catch (e: any) {
      results.verifySuccess = false
      results.verifyError = e.message
    }
  } catch (e: any) {
    results.cookiesError = e.message
  }

  return NextResponse.json(results)
}
