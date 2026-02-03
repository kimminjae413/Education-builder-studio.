// src/lib/reward/reward-system.ts
// 리워드 분배 시스템

import { query } from '@/lib/db/client'
import { getTopContributors, ContributorStats } from './usage-tracker'

export interface RewardTier {
  rank: number
  title: string
  pointsMultiplier: number
  benefits: string[]
}

export interface RewardDistribution {
  userId: string
  userName: string
  rank: number
  contributionScore: number
  rewardPoints: number
  rewardTier: RewardTier
  period: string  // YYYY-MM
}

export interface MonthlyRewardSummary {
  period: string
  totalDistributed: number
  topContributors: RewardDistribution[]
  averageReward: number
}

// 리워드 티어 정의
export const REWARD_TIERS: RewardTier[] = [
  {
    rank: 1,
    title: '🥇 최우수 기여자',
    pointsMultiplier: 3.0,
    benefits: ['프리미엄 배지', '자료 상단 노출', '무료 AI 생성 100회'],
  },
  {
    rank: 2,
    title: '🥈 우수 기여자',
    pointsMultiplier: 2.5,
    benefits: ['골드 배지', '자료 우선 노출', '무료 AI 생성 50회'],
  },
  {
    rank: 3,
    title: '🥉 우량 기여자',
    pointsMultiplier: 2.0,
    benefits: ['실버 배지', '무료 AI 생성 30회'],
  },
  {
    rank: 10,  // 4-10위
    title: '⭐ 활성 기여자',
    pointsMultiplier: 1.5,
    benefits: ['브론즈 배지', '무료 AI 생성 10회'],
  },
]

// 기본 포인트 (기여 점수 1점당)
const BASE_POINTS_PER_SCORE = 10

/**
 * 리워드 티어 결정
 */
export function getRewardTier(rank: number): RewardTier {
  if (rank === 1) return REWARD_TIERS[0]
  if (rank === 2) return REWARD_TIERS[1]
  if (rank === 3) return REWARD_TIERS[2]
  if (rank <= 10) return REWARD_TIERS[3]

  return {
    rank: rank,
    title: '참여자',
    pointsMultiplier: 1.0,
    benefits: [],
  }
}

/**
 * 리워드 포인트 계산
 */
export function calculateRewardPoints(
  contributionScore: number,
  rank: number
): number {
  const tier = getRewardTier(rank)
  return Math.round(contributionScore * BASE_POINTS_PER_SCORE * tier.pointsMultiplier)
}

/**
 * 월간 리워드 분배 실행
 */
export async function distributeMonthlyRewards(
  period?: string  // YYYY-MM, 기본: 이전 달
): Promise<MonthlyRewardSummary> {
  // 기간 설정 (기본: 이전 달)
  const targetPeriod = period || getPreviousMonth()

  // 상위 10명 기여자 조회
  const topContributors = await getTopContributors(10)

  const distributions: RewardDistribution[] = []
  let totalDistributed = 0

  for (const contributor of topContributors) {
    const tier = getRewardTier(contributor.rank)
    const rewardPoints = calculateRewardPoints(
      contributor.contributionScore,
      contributor.rank
    )

    // 리워드 기록 저장
    await saveRewardDistribution({
      userId: contributor.userId,
      period: targetPeriod,
      rank: contributor.rank,
      contributionScore: contributor.contributionScore,
      rewardPoints,
      tierTitle: tier.title,
    })

    // 사용자 포인트 증가
    await addUserPoints(contributor.userId, rewardPoints, `월간 기여 리워드 (${targetPeriod})`)

    distributions.push({
      userId: contributor.userId,
      userName: contributor.userName,
      rank: contributor.rank,
      contributionScore: contributor.contributionScore,
      rewardPoints,
      rewardTier: tier,
      period: targetPeriod,
    })

    totalDistributed += rewardPoints
  }

  return {
    period: targetPeriod,
    totalDistributed,
    topContributors: distributions,
    averageReward: distributions.length > 0
      ? Math.round(totalDistributed / distributions.length)
      : 0,
  }
}

/**
 * 리워드 분배 기록 저장
 */
async function saveRewardDistribution(data: {
  userId: string
  period: string
  rank: number
  contributionScore: number
  rewardPoints: number
  tierTitle: string
}): Promise<void> {
  await query(
    `INSERT INTO reward_distributions
     (user_id, period, rank, contribution_score, reward_points, tier_title)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, period)
     DO UPDATE SET
       rank = $3,
       contribution_score = $4,
       reward_points = $5,
       tier_title = $6,
       updated_at = NOW()`,
    [data.userId, data.period, data.rank, data.contributionScore, data.rewardPoints, data.tierTitle]
  )
}

/**
 * 사용자 포인트 추가
 */
async function addUserPoints(
  userId: string,
  points: number,
  description: string
): Promise<void> {
  // 포인트 내역 기록
  await query(
    `INSERT INTO point_transactions (user_id, points, description, type)
     VALUES ($1, $2, $3, 'reward')`,
    [userId, points, description]
  )

  // 사용자 총 포인트 업데이트
  await query(
    `UPDATE profiles
     SET points = COALESCE(points, 0) + $1
     WHERE id = $2`,
    [points, userId]
  )
}

/**
 * 사용자 리워드 히스토리 조회
 */
export async function getUserRewardHistory(
  userId: string,
  limit: number = 12
): Promise<RewardDistribution[]> {
  const result = await query(
    `SELECT
       user_id,
       period,
       rank,
       contribution_score,
       reward_points,
       tier_title
     FROM reward_distributions
     WHERE user_id = $1
     ORDER BY period DESC
     LIMIT $2`,
    [userId, limit]
  )

  return result.rows.map(row => ({
    userId: row.user_id,
    userName: '',
    rank: row.rank,
    contributionScore: parseFloat(row.contribution_score),
    rewardPoints: row.reward_points,
    rewardTier: getRewardTier(row.rank),
    period: row.period,
  }))
}

/**
 * 월간 리워드 요약 조회
 */
export async function getMonthlyRewardSummary(period: string): Promise<MonthlyRewardSummary | null> {
  const result = await query(
    `SELECT
       rd.user_id,
       u.name as user_name,
       rd.rank,
       rd.contribution_score,
       rd.reward_points,
       rd.tier_title
     FROM reward_distributions rd
     JOIN profiles u ON rd.user_id = u.id
     WHERE rd.period = $1
     ORDER BY rd.rank ASC`,
    [period]
  )

  if (result.rows.length === 0) return null

  const distributions = result.rows.map(row => ({
    userId: row.user_id,
    userName: row.user_name || 'Unknown',
    rank: row.rank,
    contributionScore: parseFloat(row.contribution_score),
    rewardPoints: row.reward_points,
    rewardTier: getRewardTier(row.rank),
    period,
  }))

  const totalDistributed = distributions.reduce((sum, d) => sum + d.rewardPoints, 0)

  return {
    period,
    totalDistributed,
    topContributors: distributions,
    averageReward: Math.round(totalDistributed / distributions.length),
  }
}

/**
 * 이전 달 문자열 반환
 */
function getPreviousMonth(): string {
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 현재 달 문자열 반환
 */
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
