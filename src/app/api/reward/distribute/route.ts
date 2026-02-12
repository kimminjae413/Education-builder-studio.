// src/app/api/reward/distribute/route.ts
// 리워드 분배 실행 API (관리자 전용)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'
import { distributeMonthlyRewards } from '@/lib/reward/reward-system'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const adminCheck = await query(
      'SELECT role FROM profiles WHERE id = $1',
      [user.uid]
    )

    if (adminCheck.rows[0]?.role !== 'admin') {
      return NextResponse.json({
        error: 'Admin access required',
      }, { status: 403 })
    }

    const body = await request.json()
    const { period } = body  // YYYY-MM 형식 (선택적)

    console.log('🎁 리워드 분배 시작:', { period: period || '이전 달' })

    const summary = await distributeMonthlyRewards(period)

    console.log('✅ 리워드 분배 완료:', {
      period: summary.period,
      totalDistributed: summary.totalDistributed,
      recipients: summary.topContributors.length,
    })

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: any) {
    console.error('❌ 리워드 분배 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}
