'use client'

import { InstructorRank, RANK_INFO } from '@/lib/rank/types'
import { cn } from '@/lib/utils/cn'

interface RankBadgeProps {
  rank?: InstructorRank | string | null
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RankBadge({ 
  rank, 
  showLabel = true, 
  size = 'md',
  className 
}: RankBadgeProps) {
  // 안전장치 1: rank가 없으면 기본값
  if (!rank) {
    rank = InstructorRank.NEWCOMER
  }

  // 안전장치 2: 올바른 rank인지 확인
  const safeRank = (rank in RANK_INFO) ? rank as InstructorRank : InstructorRank.NEWCOMER
  const info = RANK_INFO[safeRank]
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        info.color,
        info.bgColor,
        sizeClasses[size],
        className
      )}
    >
      <span className="text-lg leading-none">{info.icon}</span>
      {showLabel && <span>{info.label}</span>}
    </span>
  )
}
