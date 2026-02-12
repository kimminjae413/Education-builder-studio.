// src/components/inquiries/InquiryForm.tsx
'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { getFirebaseAuth } from '@/lib/firebase/client'

interface Props {
  onCreated: (inquiry: any) => void
  onCancel: () => void
}

export function InquiryForm({ onCreated, onCancel }: Props) {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !content.trim()) return

    setSending(true)
    try {
      const auth = getFirebaseAuth()
      const token = await auth.currentUser?.getIdToken()

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, content }),
      })
      if (res.ok) {
        const { inquiry } = await res.json()
        onCreated(inquiry)
      }
    } catch (error) {
      console.error('문의 생성 오류:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-cobalt-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">새 문의 작성</h3>
        <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none"
          placeholder="문의 제목"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none resize-y"
          placeholder="문의 내용을 상세하게 입력해주세요"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={sending || !subject.trim() || !content.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {sending ? '전송 중...' : '문의 보내기'}
        </button>
      </div>
    </form>
  )
}
