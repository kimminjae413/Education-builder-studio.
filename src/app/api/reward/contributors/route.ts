// src/app/api/reward/contributors/route.ts
// 기여자 통계 및 리워드 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import {
  getTopContributors,
  getContributorStats,
  getMaterialUsageStats,
} from '@/lib/reward/usage-tracker'
import {
  getUserRewardHistory,
  getMonthlyRewardSummary,
  getCurrentMonth,
  REWARD_TIERS,
} from '@/lib/reward/reward-system'

// GET: 기여자 순위 및 통계 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'top'
    const limit = parseInt(searchParams.get('limit') || '10')

    switch (action) {
      case 'top': {
        // 상위 기여자 목록
        const contributors = await getTopContributors(limit)
        return NextResponse.json({
          success: true,
          contributors,
          tiers: REWARD_TIERS,
        })
      }

      case 'my': {
        // 내 기여 통계
        const user = await getAuthenticatedUser(request)
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const stats = await getContributorStats(user.uid)
        const history = await getUserRewardHistory(user.uid)

        return NextResponse.json({
          success: true,
          stats,
          rewardHistory: history,
        })
      }

      case 'monthly': {
        // 월간 리워드 요약
        const period = searchParams.get('period') || getCurrentMonth()
        const summary = await getMonthlyRewardSummary(period)

        return NextResponse.json({
          success: true,
          summary,
          period,
        })
      }

      case 'material': {
        // 자료별 사용 통계
        const materialId = searchParams.get('materialId')
        if (!materialId) {
          return NextResponse.json({
            error: 'materialId is required',
          }, { status: 400 })
        }

        const usage = await getMaterialUsageStats(materialId)
        return NextResponse.json({
          success: true,
          usage,
        })
      }

      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['top', 'my', 'monthly', 'material'],
        }, { status: 400 })
    }
  } catch (error: any) {
    console.error('❌ 기여자 API 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}
