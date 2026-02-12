// src/app/(dashboard)/inquiries/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Clock, CheckCircle, AlertCircle, XCircle, MessageSquare, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { InquiryForm } from '@/components/inquiries/InquiryForm'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged } from 'firebase/auth'

type InquiryStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

interface Inquiry {
  id: string
  subject: string
  content: string
  status: InquiryStatus
  reply_count: number
  created_at: string
  updated_at: string
}

const STATUS_CONFIG: Record<InquiryStatus, {
  label: string
  color: string
  bg: string
  icon: typeof Clock
}> = {
  pending: { label: '대기중', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  in_progress: { label: '처리중', color: 'text-blue-700', bg: 'bg-blue-100', icon: AlertCircle },
  resolved: { label: '답변완료', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  closed: { label: '종료', color: 'text-gray-600', bg: 'bg-gray-100', icon: XCircle },
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken()
          const res = await fetch('/api/inquiries', {
            headers: { 'Authorization': `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            setInquiries(data.inquiries)
          }
        } catch (error) {
          console.error('문의 목록 조회 오류:', error)
        }
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  function handleCreated(inquiry: Inquiry) {
    setInquiries(prev => [inquiry, ...prev])
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">1:1 문의</h1>
          <p className="text-gray-600 mt-1">궁금한 점이나 도움이 필요하시면 문의해주세요</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          새 문의
        </button>
      </div>

      {showForm && (
        <InquiryForm
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-3">
        {inquiries.map((inquiry) => {
          const config = STATUS_CONFIG[inquiry.status]
          const StatusIcon = config.icon

          return (
            <Link
              key={inquiry.id}
              href={`/inquiries/${inquiry.id}`}
              className="block bg-white border rounded-xl p-4 hover:border-cobalt-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded', config.bg, config.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <h3 className="font-semibold text-gray-900 truncate">{inquiry.subject}</h3>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{inquiry.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{new Date(inquiry.created_at).toLocaleDateString('ko-KR')}</span>
                    {inquiry.reply_count > 0 && (
                      <span className="flex items-center gap-1 text-cobalt-600">
                        <MessageSquare className="w-3 h-3" /> 답변 {inquiry.reply_count}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
              </div>
            </Link>
          )
        })}

        {inquiries.length === 0 && !showForm && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">아직 문의 내역이 없습니다</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              첫 문의 작성하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
