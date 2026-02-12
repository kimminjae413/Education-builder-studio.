// src/components/admin/AnnouncementAdminList.tsx
'use client'

import { useState } from 'react'
import { Pin, Eye, EyeOff, Pencil, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { AnnouncementForm } from './AnnouncementForm'
import { getFirebaseAuth } from '@/lib/firebase/client'

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_published: boolean
  author_name: string
  view_count: number
  created_at: string
  updated_at: string
}

interface Props {
  initialAnnouncements: Announcement[]
}

export function AnnouncementAdminList({ initialAnnouncements }: Props) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function getAuthHeaders() {
    const auth = getFirebaseAuth()
    const token = await auth.currentUser?.getIdToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setLoading(id)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers,
      })
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    } finally {
      setLoading(null)
    }
  }

  async function handleTogglePin(a: Announcement) {
    setLoading(a.id)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admin/announcements/${a.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_pinned: !a.is_pinned }),
      })
      if (res.ok) {
        const { announcement } = await res.json()
        setAnnouncements(prev => prev.map(item => item.id === a.id ? { ...item, ...announcement } : item))
      }
    } catch (error) {
      console.error('고정 토글 오류:', error)
    } finally {
      setLoading(null)
    }
  }

  async function handleTogglePublish(a: Announcement) {
    setLoading(a.id)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admin/announcements/${a.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_published: !a.is_published }),
      })
      if (res.ok) {
        const { announcement } = await res.json()
        setAnnouncements(prev => prev.map(item => item.id === a.id ? { ...item, ...announcement } : item))
      }
    } catch (error) {
      console.error('공개 토글 오류:', error)
    } finally {
      setLoading(null)
    }
  }

  function handleCreated(newAnnouncement: Announcement) {
    setAnnouncements(prev => [newAnnouncement, ...prev])
    setShowForm(false)
  }

  function handleUpdated(updatedAnnouncement: Announcement) {
    setAnnouncements(prev => prev.map(a => a.id === updatedAnnouncement.id ? { ...a, ...updatedAnnouncement } : a))
    setEditTarget(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">총 {announcements.length}건</p>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          새 공지 작성
        </button>
      </div>

      {/* 작성/수정 폼 */}
      {showForm && (
        <AnnouncementForm
          editTarget={editTarget}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      {/* 목록 */}
      <div className="space-y-3">
        {announcements.map((a) => (
          <div
            key={a.id}
            className={cn(
              'bg-white border rounded-xl p-4',
              a.is_pinned && 'border-amber-300 bg-amber-50/50',
              !a.is_published && 'opacity-60'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {a.is_pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      <Pin className="w-3 h-3" /> 고정
                    </span>
                  )}
                  {!a.is_published && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                      <EyeOff className="w-3 h-3" /> 비공개
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{a.author_name}</span>
                  <span>{new Date(a.created_at).toLocaleDateString('ko-KR')}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {a.view_count}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleTogglePin(a)}
                  disabled={loading === a.id}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    a.is_pinned ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-gray-400 hover:bg-gray-100'
                  )}
                  title={a.is_pinned ? '고정 해제' : '상단 고정'}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTogglePublish(a)}
                  disabled={loading === a.id}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    a.is_published ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                  )}
                  title={a.is_published ? '비공개로 변경' : '공개하기'}
                >
                  {a.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setEditTarget(a); setShowForm(true) }}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  title="수정"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={loading === a.id}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            아직 공지사항이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
