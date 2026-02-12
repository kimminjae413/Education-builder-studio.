import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin'
import { query } from '@/lib/db/client'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'

export async function GET(request: NextRequest) {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const results: Record<string, unknown> = {}

  // Admin SDK 초기화 테스트
  try {
    const auth = getAdminAuth()
    results.adminInitialized = true
  } catch (e: any) {
    results.adminInitialized = false
    results.adminError = e.message
  }

  // DB 연결 테스트
  try {
    const res = await query('SELECT NOW()')
    results.dbConnected = true
    results.dbTime = res.rows[0].now
  } catch (e: any) {
    results.dbConnected = false
    results.dbError = e.message
  }

  // 테이블 존재 확인
  try {
    const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    results.tables = tables.rows.map((r: any) => r.table_name)
  } catch (e: any) {
    results.tablesError = e.message
  }

  // 인증된 사용자가 있으면 프로필 조회 테스트
  try {
    const user = await getAuthenticatedUser(request)
    if (user) {
      results.authUser = user.uid
      const profile = await query('SELECT * FROM profiles WHERE id = $1', [user.uid])
      results.profileFound = profile.rows.length > 0
      if (profile.rows.length > 0) {
        results.profile = profile.rows[0]
      }
    }
  } catch (e: any) {
    results.profileError = e.message
  }

  return NextResponse.json(results)
}
