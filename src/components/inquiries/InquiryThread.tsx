// src/components/inquiries/InquiryThread.tsx
'use client'

import { useState } from 'react'
import { Clock, CheckCircle, AlertCircle, XCircle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type InquiryStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

interface Inquiry {
  id: string
  subject: string
  content: string
  status: InquiryStatus
  created_at: string
  updated_at: string
}

interface Reply {
  id: string
  author_name: string
  content: string
  is_admin: boolean
  created_at: string
}

interface Props {
  inquiry: Inquiry
  initialReplies: Reply[]
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

export function InquiryThread({ inquiry, initialReplies }: Props) {
  const [replies] = useState(initialReplies)

  const config = STATUS_CONFIG[inquiry.status]
  const StatusIcon = config.icon

  return (
    <div className="space-y-6">
      {/* 문의 헤더 */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{inquiry.subject}</h2>
          <span className={cn('inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-lg shrink-0', config.bg, config.color)}>
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </span>
        </div>
        <div className="text-sm text-gray-500 mb-4">
          {new Date(inquiry.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </div>
        <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-800">
          {inquiry.content}
        </div>
      </div>

      {/* 답변 스레드 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">답변 내역 ({replies.length})</h3>

        {replies.map((reply) => (
          <div
            key={reply.id}
            className={cn(
              'rounded-xl p-4 max-w-[85%]',
              reply.is_admin
                ? 'bg-cobalt-50 border border-cobalt-200'
                : 'bg-gray-50 border border-gray-200 ml-auto'
            )}
          >
            <div className="flex items-center gap-2 mb-2 text-xs">
              <Shield className="w-3.5 h-3.5 text-cobalt-600" />
              <span className="font-medium text-cobalt-700">관리자</span>
              <span className="text-gray-400">
                {new Date(reply.created_at).toLocaleString('ko-KR')}
              </span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{reply.content}</p>
          </div>
        ))}

        {replies.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            아직 답변이 없습니다. 관리자가 곧 답변드리겠습니다.
          </div>
        )}
      </div>

      {/* 상태 안내 */}
      {inquiry.status === 'closed' ? (
        <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-xl">
          이 문의는 종료되었습니다
        </div>
      ) : inquiry.status === 'resolved' ? (
        <div className="text-center py-4 text-sm text-green-600 bg-green-50 rounded-xl">
          답변이 완료되었습니다
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-xl">
          관리자 답변을 기다리고 있습니다
        </div>
      )}
    </div>
  )
}
