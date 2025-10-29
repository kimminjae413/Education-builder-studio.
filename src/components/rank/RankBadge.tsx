'use client'

import { InstructorRank, RANK_INFO } from '@/lib/rank/types'
import { cn } from '@/lib/utils/cn'

interface RankBadgeProps {
  rank: InstructorRank
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
  const info = RANK_INFO[rank]
  
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
