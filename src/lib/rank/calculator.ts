import { InstructorRank, RANK_INFO } from './types'

/**
 * 콘텐츠 통계를 기반으로 랭크 포인트 계산
 * 
 * 계산식:
 * (사용 횟수 × 10) + (다운로드 × 20) + (북마크 × 15) + (평점 × 평가 수 × 50)
 */
export function calculateRankPoints(stats: {
  usageCount: number
  downloadCount: number
  bookmarkCount: number
  rating: number
  ratingCount: number
}): number {
  return (
    stats.usageCount * 10 +
    stats.downloadCount * 20 +
    stats.bookmarkCount * 15 +
    Math.floor(stats.rating * stats.ratingCount * 50)
  )
}

/**
 * 포인트를 기반으로 랭크 결정
 * 
 * 주의: MASTER는 10000점 이상이어도 관리자 승인이 필요
 */
export function getRankFromPoints(points: number): InstructorRank {
  if (points >= 10000) return InstructorRank.VETERAN // MASTER는 승인 필요
  if (points >= 5000) return InstructorRank.VETERAN
  if (points >= 2000) return InstructorRank.SENIOR
  if (points >= 500) return InstructorRank.INTERMEDIATE
  if (points >= 100) return InstructorRank.JUNIOR
  return InstructorRank.NEWCOMER
}

/**
 * 랭크별 임계값 반환
 */
export function getRankThresholds() {
  return {
    [InstructorRank.NEWCOMER]: { min: 0, max: 99 },
    [InstructorRank.JUNIOR]: { min: 100, max: 499 },
    [InstructorRank.INTERMEDIATE]: { min: 500, max: 1999 },
    [InstructorRank.SENIOR]: { min: 2000, max: 4999 },
    [InstructorRank.VETERAN]: { min: 5000, max: 9999 },
    [InstructorRank.MASTER]: { min: 10000, max: Infinity },
  }
}

/**
 * 다음 랭크 반환
 */
export function getNextRank(currentRank: InstructorRank): InstructorRank | null {
  const ranks = Object.values(InstructorRank)
  const currentIndex = ranks.indexOf(currentRank)
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null
}

/**
 * 다음 랭크까지 필요한 포인트 계산
 */
export function getPointsToNextRank(
  currentPoints: number,
  currentRank: InstructorRank
): number {
  const thresholds = getRankThresholds()
  const nextRank = getNextRank(currentRank)
  
  if (!nextRank) return 0
  
  return thresholds[nextRank].min - currentPoints
}

/**
 * 랭크 진행률 (0-100%) 계산
 */
export function getRankProgress(
  currentPoints: number,
  currentRank: InstructorRank
): number {
  const thresholds = getRankThresholds()
  const currentThreshold = thresholds[currentRank]
  const nextRank = getNextRank(currentRank)
  
  if (!nextRank) return 100
  
  const nextThreshold = thresholds[nextRank]
  const pointsInCurrentRank = currentPoints - currentThreshold.min
  const pointsNeeded = nextThreshold.min - currentThreshold.min
  
  return Math.min((pointsInCurrentRank / pointsNeeded) * 100, 100)
}

/**
 * 랭크에 따른 리워드 배율 반환
 */
export function getRewardMultiplier(rank: InstructorRank): number {
  return RANK_INFO[rank].rewardMultiplier
}
