// src/app/api/admin/users/rank/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'

export async function PATCH(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 확인
    const admin = await isAdmin(user.uid)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, rank, reason } = await request.json()

    if (!userId || !rank || !reason) {
      return NextResponse.json(
        { error: 'userId, rank, reason are required' },
        { status: 400 }
      )
    }

    // 랭크 업데이트
    await query(
      `UPDATE profiles SET
        rank = $1,
        manual_rank_override = true,
        manual_rank_reason = $2,
        rank_updated_at = NOW()
      WHERE id = $3`,
      [rank, reason, userId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating rank:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update rank' },
      { status: 500 }
    )
  }
}
