import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin'

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

  return NextResponse.json(results)
}
