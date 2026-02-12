// src/components/messages/UnreadBadge.tsx
'use client'

interface UnreadBadgeProps {
  count: number
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
      {count > 9 ? '9+' : count}
    </span>
  )
}
