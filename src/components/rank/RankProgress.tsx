'use client'

import { InstructorRank, RANK_INFO } from '@/lib/rank/types'
import { getRankThresholds, getNextRank, getPointsToNextRank } from '@/lib/rank/calculator'

interface RankProgressProps {
  currentRank?: InstructorRank | string | null
  currentPoints?: number | null
}

export function RankProgress({ currentRank, currentPoints }: RankProgressProps) {
  // 안전장치 1: 기본값 설정
  const safeRank = (currentRank && currentRank in RANK_INFO) 
    ? currentRank as InstructorRank 
    : InstructorRank.NEWCOMER
  const safePoints = currentPoints || 0

  const nextRank = getNextRank(safeRank)
  const thresholds = getRankThresholds()
  
  if (!nextRank) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600">
          🎉 최고 랭크에 도달했습니다!
        </p>
      </div>
    )
  }

  // 안전장치 2: thresholds 확인
  const currentThreshold = thresholds[safeRank]
  const nextThreshold = thresholds[nextRank]

  if (!currentThreshold || !nextThreshold) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-500">
          랭크 정보를 불러오는 중...
        </p>
      </div>
    )
  }

  const pointsInCurrentRank = safePoints - currentThreshold.min
  const pointsNeeded = nextThreshold.min - currentThreshold.min
  const percentage = Math.min(Math.max((pointsInCurrentRank / pointsNeeded) * 100, 0), 100)
  const pointsRemaining = getPointsToNextRank(safePoints, safeRank)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {RANK_INFO[safeRank].label}
        </span>
        <span className="text-gray-500">
          {pointsRemaining.toLocaleString()}점 남음
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cobalt-500 to-cobalt-600 transition-all duration-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{safePoints.toLocaleString()}점</span>
        <span className="text-cobalt-600 font-medium">
          {RANK_INFO[nextRank].label} →
        </span>
        <span>{nextThreshold.min.toLocaleString()}점</span>
      </div>
    </div>
  )
}
