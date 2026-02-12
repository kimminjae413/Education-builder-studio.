// src/components/messages/NewMessageComposer.tsx
'use client'

import { useState } from 'react'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import { UserSearchInput } from './UserSearchInput'

interface UserResult {
  id: string
  name: string
  rank: string
  profile_image_url: string | null
}

interface NewMessageComposerProps {
  token: string
  onBack: () => void
  onSent: (conversationId: string) => void
}

export function NewMessageComposer({ token, onBack, onSent }: NewMessageComposerProps) {
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!selectedUser || !content.trim()) return

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          content: content.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '전송에 실패했습니다')
        return
      }

      onSent(data.conversationId)
    } catch {
      setError('네트워크 오류가 발생했습니다')
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

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-medium text-gray-900">새 메시지</span>
      </div>

      {/* 수신자 검색 */}
      <div className="p-4 border-b bg-gray-50">
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">받는 사람</label>
        <UserSearchInput
          token={token}
          onSelect={setSelectedUser}
          placeholder="이름으로 검색..."
        />
      </div>

      {/* 메시지 입력 */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedUser ? `${selectedUser.name}님에게 보낼 메시지...` : '받는 사람을 먼저 선택하세요'}
          className="w-full h-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none"
          maxLength={2000}
          disabled={!selectedUser}
        />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* 전송 버튼 */}
      <div className="p-4 border-t bg-white">
        <button
          onClick={handleSend}
          disabled={!selectedUser || !content.trim() || sending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-cobalt-500 text-white font-medium rounded-lg hover:bg-cobalt-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sending ? '전송 중...' : '메시지 전송'}
        </button>
      </div>
    </div>
  )
}
