// src/components/admin/AnnouncementForm.tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { getFirebaseAuth } from '@/lib/firebase/client'

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_published: boolean
}

interface Props {
  editTarget: Announcement | null
  onCreated: (announcement: any) => void
  onUpdated: (announcement: any) => void
  onCancel: () => void
}

export function AnnouncementForm({ editTarget, onCreated, onUpdated, onCancel }: Props) {
  const [title, setTitle] = useState(editTarget?.title || '')
  const [content, setContent] = useState(editTarget?.content || '')
  const [isPinned, setIsPinned] = useState(editTarget?.is_pinned || false)
  const [isPublished, setIsPublished] = useState(editTarget?.is_published ?? true)
  const [saving, setSaving] = useState(false)

  async function getAuthHeaders() {
    const auth = getFirebaseAuth()
    const token = await auth.currentUser?.getIdToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setSaving(true)
    try {
      const headers = await getAuthHeaders()

      if (editTarget) {
        // 수정
        const res = await fetch(`/api/admin/announcements/${editTarget.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ title, content, is_pinned: isPinned, is_published: isPublished }),
        })
        if (res.ok) {
          const { announcement } = await res.json()
          onUpdated(announcement)
        }
      } else {
        // 생성
        const res = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title, content, is_pinned: isPinned, is_published: isPublished }),
        })
        if (res.ok) {
          const { announcement } = await res.json()
          onCreated(announcement)
        }
      }
    } catch (error) {
      console.error('저장 오류:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-cobalt-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {editTarget ? '공지사항 수정' : '새 공지사항 작성'}
        </h3>
        <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none"
          placeholder="공지사항 제목"
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
          placeholder="공지사항 내용을 입력해주세요"
          required
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-gray-700">상단 고정</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">즉시 공개</span>
        </label>
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
          disabled={saving || !title.trim() || !content.trim()}
          className="px-4 py-2 text-sm bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : editTarget ? '수정' : '작성'}
        </button>
      </div>
    </form>
  )
}
