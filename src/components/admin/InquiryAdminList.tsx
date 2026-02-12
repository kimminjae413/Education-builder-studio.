// src/components/admin/InquiryAdminList.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle, AlertCircle, XCircle, MessageSquare, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type InquiryStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

interface Inquiry {
  id: string
  user_name: string
  user_email: string
  subject: string
  content: string
  status: InquiryStatus
  reply_count: number
  created_at: string
  updated_at: string
}

interface Props {
  initialInquiries: Inquiry[]
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

export function InquiryAdminList({ initialInquiries }: Props) {
  const [inquiries] = useState(initialInquiries)
  const [filterStatus, setFilterStatus] = useState<InquiryStatus | 'all'>('all')

  const filtered = filterStatus === 'all'
    ? inquiries
    : inquiries.filter(i => i.status === filterStatus)

  const statusCounts = {
    all: inquiries.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    in_progress: inquiries.filter(i => i.status === 'in_progress').length,
    resolved: inquiries.filter(i => i.status === 'resolved').length,
    closed: inquiries.filter(i => i.status === 'closed').length,
  }

  return (
    <div className="space-y-4">
      {/* 상태 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'pending', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              filterStatus === status
                ? 'bg-cobalt-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {status === 'all' ? '전체' : STATUS_CONFIG[status].label}
            <span className="ml-1 opacity-70">({statusCounts[status]})</span>
          </button>
        ))}
      </div>

      {/* 문의 목록 */}
      <div className="space-y-3">
        {filtered.map((inquiry) => {
          const config = STATUS_CONFIG[inquiry.status]
          const StatusIcon = config.icon

          return (
            <Link
              key={inquiry.id}
              href={`/admin/inquiries/${inquiry.id}`}
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
                    <span className="font-medium">{inquiry.user_name}</span>
                    <span>{inquiry.user_email}</span>
                    <span>{new Date(inquiry.created_at).toLocaleDateString('ko-KR')}</span>
                    {inquiry.reply_count > 0 && (
                      <span className="flex items-center gap-1 text-cobalt-600">
                        <MessageSquare className="w-3 h-3" /> {inquiry.reply_count}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
              </div>
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {filterStatus === 'all' ? '아직 문의가 없습니다' : '해당 상태의 문의가 없습니다'}
          </div>
        )}
      </div>
    </div>
  )
}
