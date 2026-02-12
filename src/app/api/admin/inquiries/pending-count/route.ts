// src/app/api/admin/inquiries/pending-count/route.ts
// 대기중 문의 수 (관리자 사이드바 뱃지용)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const result = await query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM inquiries WHERE status IN ('pending', 'in_progress')`
    )
    const count = result.rows[0]?.count || 0

    return NextResponse.json({ count })
  } catch (error) {
    console.error('대기중 문의 수 조회 오류:', error)
    return NextResponse.json({ count: 0 })
  }
}
