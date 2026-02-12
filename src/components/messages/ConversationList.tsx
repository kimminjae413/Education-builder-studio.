// src/components/messages/ConversationList.tsx
'use client'

import { RankBadge } from '@/components/rank/RankBadge'
import { cn } from '@/lib/utils/cn'
import { MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  partner_id: string
  partner_name: string
  partner_rank: string
  partner_image: string | null
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <MessageSquare className="w-12 h-12 mb-3" />
        <p className="text-sm">아직 대화가 없습니다</p>
        <p className="text-xs mt-1">새 메시지를 보내보세요!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            'w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left',
            selectedId === conv.id && 'bg-cobalt-50 hover:bg-cobalt-50'
          )}
        >
          {/* 아바타 */}
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            {conv.partner_image ? (
              <img src={conv.partner_image} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-gray-500">
                {(conv.partner_name || '?')[0]}
              </span>
            )}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={cn(
                  'text-sm truncate',
                  conv.unread_count > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                )}>
                  {conv.partner_name || '알 수 없음'}
                </span>
                <RankBadge rank={conv.partner_rank} size="sm" />
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {timeAgo(conv.last_message_at)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className={cn(
                'text-xs truncate',
                conv.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
              )}>
                {conv.last_message_preview || '새 대화'}
              </p>
              {conv.unread_count > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center bg-cobalt-500 text-white text-[10px] font-bold rounded-full px-1.5 flex-shrink-0">
                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
