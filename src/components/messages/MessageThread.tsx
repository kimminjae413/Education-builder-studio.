// src/components/messages/MessageThread.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import { RankBadge } from '@/components/rank/RankBadge'
import { cn } from '@/lib/utils/cn'

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface Partner {
  id: string
  name: string
  rank: string
  profile_image_url: string | null
}

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
  token: string
  onBack?: () => void
}

export function MessageThread({ conversationId, currentUserId, token, onBack }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [partner, setPartner] = useState<Partner | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async (cursor?: string) => {
    try {
      const url = `/api/messages/conversations/${conversationId}${cursor ? `?cursor=${cursor}` : ''}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (cursor) {
          setMessages((prev) => [...prev, ...data.messages])
        } else {
          setMessages(data.messages)
          setPartner(data.partner)
        }
        setHasMore(data.hasMore)
      }
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false)
    }
  }, [conversationId, token])

  // 초기 로딩
  useEffect(() => {
    setLoading(true)
    setMessages([])
    fetchMessages()
  }, [conversationId, fetchMessages])

  // 30초 폴링
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // 새 메시지 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: partner?.id,
          content: newMessage.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [data.message, ...prev])
        setNewMessage('')
      }
    } catch {
      // 조용히 실패
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const loadMore = () => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(messages[messages.length - 1].id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  // 메시지를 시간순 정렬 (오래된 것 위, 최신 아래)
  const sortedMessages = [...messages].reverse()

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        {onBack && (
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg lg:hidden">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          {partner?.profile_image_url ? (
            <img src={partner.profile_image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <span className="text-sm text-gray-500">{(partner?.name || '?')[0]}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{partner?.name || '알 수 없음'}</span>
          {partner?.rank && <RankBadge rank={partner.rank} size="sm" />}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              className="text-xs text-cobalt-600 hover:underline"
            >
              이전 메시지 더 보기
            </button>
          </div>
        )}

        {sortedMessages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words',
                  isMine
                    ? 'bg-cobalt-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                )}
              >
                {msg.content}
                <div className={cn(
                  'text-[10px] mt-1',
                  isMine ? 'text-cobalt-200' : 'text-gray-400'
                )}>
                  {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none max-h-24"
            rows={1}
            maxLength={2000}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
