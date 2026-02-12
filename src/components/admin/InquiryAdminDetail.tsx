// src/components/admin/InquiryAdminDetail.tsx
'use client'

import { useState } from 'react'
import { Clock, CheckCircle, AlertCircle, XCircle, Shield, User, Send } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getFirebaseAuth } from '@/lib/firebase/client'

type InquiryStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

interface Inquiry {
  id: string
  user_name: string
  user_email: string
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

export function InquiryAdminDetail({ inquiry, initialReplies }: Props) {
  const [replies, setReplies] = useState(initialReplies)
  const [replyContent, setReplyContent] = useState('')
  const [currentStatus, setCurrentStatus] = useState(inquiry.status)
  const [sending, setSending] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  async function getAuthHeaders() {
    const auth = getFirebaseAuth()
    const token = await auth.currentUser?.getIdToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSending(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: replyContent }),
      })
      if (res.ok) {
        const { reply } = await res.json()
        setReplies(prev => [...prev, { ...reply, author_name: '관리자' }])
        setReplyContent('')
        if (currentStatus === 'pending') setCurrentStatus('in_progress')
      }
    } catch (error) {
      console.error('답변 오류:', error)
    } finally {
      setSending(false)
    }
  }

  async function handleStatusChange(newStatus: InquiryStatus) {
    setChangingStatus(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setCurrentStatus(newStatus)
      }
    } catch (error) {
      console.error('상태 변경 오류:', error)
    } finally {
      setChangingStatus(false)
    }
  }

  const config = STATUS_CONFIG[currentStatus]
  const StatusIcon = config.icon

  return (
    <div className="space-y-6">
      {/* 문의 헤더 */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{inquiry.subject}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{inquiry.user_name}</span>
              <span>{inquiry.user_email}</span>
              <span>{new Date(inquiry.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
          <span className={cn('inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-lg', config.bg, config.color)}>
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-800">
          {inquiry.content}
        </div>
      </div>

      {/* 상태 변경 */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">상태 변경</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(STATUS_CONFIG) as InquiryStatus[]).map((status) => {
            const sc = STATUS_CONFIG[status]
            const Icon = sc.icon
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={changingStatus || currentStatus === status}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  currentStatus === status
                    ? `${sc.bg} ${sc.color} font-medium ring-2 ring-offset-1 ring-current`
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {sc.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 답변 스레드 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">대화 내역 ({replies.length})</h3>

        {replies.map((reply) => (
          <div
            key={reply.id}
            className={cn(
              'rounded-xl p-4 max-w-[85%]',
              reply.is_admin
                ? 'bg-cobalt-50 border border-cobalt-200 ml-auto'
                : 'bg-gray-50 border border-gray-200'
            )}
          >
            <div className="flex items-center gap-2 mb-2 text-xs">
              {reply.is_admin ? (
                <Shield className="w-3.5 h-3.5 text-cobalt-600" />
              ) : (
                <User className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span className={cn('font-medium', reply.is_admin ? 'text-cobalt-700' : 'text-gray-700')}>
                {reply.author_name}
              </span>
              <span className="text-gray-400">
                {new Date(reply.created_at).toLocaleString('ko-KR')}
              </span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{reply.content}</p>
          </div>
        ))}

        {replies.length === 0 && (
          <div className="text-center py-6 text-sm text-gray-500">
            아직 답변이 없습니다
          </div>
        )}
      </div>

      {/* 답변 폼 */}
      <form onSubmit={handleReply} className="bg-white border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">관리자 답변</h3>
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none resize-y text-sm"
          placeholder="답변을 입력해주세요..."
        />
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={sending || !replyContent.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cobalt-500 text-white text-sm font-medium rounded-lg hover:bg-cobalt-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? '전송 중...' : '답변 전송'}
          </button>
        </div>
      </form>
    </div>
  )
}
