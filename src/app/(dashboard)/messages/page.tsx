// src/app/(dashboard)/messages/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged, User } from 'firebase/auth'
import { PenSquare, MessageSquare, Loader2 } from 'lucide-react'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'
import { NewMessageComposer } from '@/components/messages/NewMessageComposer'

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

type ViewMode = 'list' | 'thread' | 'new'

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const t = await u.getIdToken()
        setToken(t)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchConversations()
    }
  }, [token, fetchConversations])

  // 30초 폴링으로 대화 목록 갱신
  useEffect(() => {
    if (!token) return
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [token, fetchConversations])

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id)
    setViewMode('thread')
  }

  const handleNewMessage = () => {
    setSelectedConversationId(null)
    setViewMode('new')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedConversationId(null)
    fetchConversations()
  }

  const handleMessageSent = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setViewMode('thread')
    fetchConversations()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
      <div className="flex h-full">
        {/* 좌측: 대화 목록 (데스크톱 항상 표시, 모바일 list 모드일 때만) */}
        <div className={`w-full lg:w-80 lg:border-r flex flex-col ${viewMode !== 'list' ? 'hidden lg:flex' : 'flex'}`}>
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">메시지</h2>
            <button
              onClick={handleNewMessage}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="새 메시지"
            >
              <PenSquare className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 대화 목록 */}
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={handleSelectConversation}
            />
          </div>
        </div>

        {/* 우측: 메시지 스레드 또는 새 메시지 */}
        <div className={`flex-1 flex flex-col ${viewMode === 'list' ? 'hidden lg:flex' : 'flex'}`}>
          {viewMode === 'new' ? (
            <NewMessageComposer
              token={token}
              onBack={handleBackToList}
              onSent={handleMessageSent}
            />
          ) : selectedConversationId ? (
            <MessageThread
              conversationId={selectedConversationId}
              currentUserId={user?.uid || ''}
              token={token}
              onBack={handleBackToList}
            />
          ) : (
            /* 아무것도 선택되지 않았을 때 */
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">대화를 선택하세요</p>
              <p className="text-sm mt-1">또는 새 메시지를 작성해보세요</p>
              <button
                onClick={handleNewMessage}
                className="mt-4 px-4 py-2 bg-cobalt-500 text-white text-sm font-medium rounded-lg hover:bg-cobalt-600 transition-colors"
              >
                새 메시지 작성
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
