'use client'

import { InstructorRank, RANK_INFO } from '@/lib/rank/types'
import { getRankThresholds, getNextRank, getPointsToNextRank } from '@/lib/rank/calculator'

interface RankProgressProps {
  currentRank: InstructorRank
  currentPoints: number
}

export function RankProgress({ currentRank, currentPoints }: RankProgressProps) {
  const nextRank = getNextRank(currentRank)
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

  const currentThreshold = thresholds[currentRank]
  const nextThreshold = thresholds[nextRank]
  const pointsInCurrentRank = currentPoints - currentThreshold.min
  const pointsNeeded = nextThreshold.min - currentThreshold.min
  const percentage = Math.min((pointsInCurrentRank / pointsNeeded) * 100, 100)
  const pointsRemaining = getPointsToNextRank(currentPoints, currentRank)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {RANK_INFO[currentRank].label}
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
        <span>{currentPoints.toLocaleString()}점</span>
        <span className="text-cobalt-600 font-medium">
          {RANK_INFO[nextRank].label} →
        </span>
        <span>{nextThreshold.min.toLocaleString()}점</span>
      </div>
    </div>
  )
}
