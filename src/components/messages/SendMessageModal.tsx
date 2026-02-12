// src/components/messages/SendMessageModal.tsx
'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'

interface SendMessageModalProps {
  recipientId: string
  recipientName: string
  token: string
  onClose: () => void
  onSent?: () => void
}

export function SendMessageModal({
  recipientId,
  recipientName,
  token,
  onClose,
  onSent,
}: SendMessageModalProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSend = async () => {
    if (!content.trim()) return

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId, content: content.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '전송에 실패했습니다')
        return
      }

      setSuccess(true)
      onSent?.()
      setTimeout(() => onClose(), 1000)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">
            {recipientName}님에게 메시지
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 성공 메시지 */}
        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg text-center">
            메시지가 전송되었습니다!
          </div>
        )}

        {/* 본문 */}
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none"
            maxLength={2000}
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{content.length}/2000</span>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className="flex items-center gap-2 px-4 py-2 bg-cobalt-500 text-white text-sm font-medium rounded-lg hover:bg-cobalt-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {sending ? '전송 중...' : '전송'}
          </button>
        </div>
      </div>
    </div>
  )
}
