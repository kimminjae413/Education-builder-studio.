import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin'
import { query } from '@/lib/db/client'

export async function GET(request: NextRequest) {
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

  // 환경 변수 확인
  results.hasDatabaseUrl = !!process.env.DATABASE_URL
  results.databaseUrlStart = process.env.DATABASE_URL?.substring(0, 30) || 'not set'

  return NextResponse.json(results)
}
