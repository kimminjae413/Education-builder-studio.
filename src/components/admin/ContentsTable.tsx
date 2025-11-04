// src/components/admin/ContentsTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RankBadge } from '@/components/rank/RankBadge'
import { InstructorRank } from '@/lib/rank/types'
import { Search, FileText, Download, Eye, CheckCircle, XCircle, X } from 'lucide-react'

interface ContentsTableProps {
  materials: any[]
}

interface ReviewModal {
  isOpen: boolean
  material: any | null
  action: 'approve' | 'reject' | null
}

export function ContentsTable({ materials }: ContentsTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 🔴 리뷰 모달 상태
  const [modal, setModal] = useState<ReviewModal>({ isOpen: false, material: null, action: null })
  const [reviewNote, setReviewNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 필터링된 콘텐츠
  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = 
        material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.uploader?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || material.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const aVal = sortBy === 'created_at' 
        ? new Date(a.created_at).getTime() 
        : (a.title || '')
      const bVal = sortBy === 'created_at' 
        ? new Date(b.created_at).getTime() 
        : (b.title || '')

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal)
      }
      return sortOrder === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal
    })

  // 🔴 리뷰 모달 열기
  const openReviewModal = (material: any, action: 'approve' | 'reject') => {
    setModal({ isOpen: true, material, action })
    setReviewNote(material.review_note || '')
  }

  // 🔴 리뷰 모달 닫기
  const closeReviewModal = () => {
    setModal({ isOpen: false, material: null, action: null })
    setReviewNote('')
    setIsSubmitting(false)
  }

  // 🔴 승인/거부 제출
  const handleReviewSubmit = async () => {
    if (!modal.material || !modal.action) return

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const newStatus = modal.action === 'approve' ? 'approved' : 'rejected'

      const { error } = await supabase
        .from('teaching_materials')
        .update({
          status: newStatus,
          review_note: reviewNote.trim() || null,
          reviewed_at: new Date().toISOString(),
          // reviewed_by는 서버에서 자동으로 설정되어야 하지만, 
          // 클라이언트에서도 설정 가능하도록 추가
        })
        .eq('id', modal.material.id)

      if (error) throw error

      const actionText = modal.action === 'approve' ? '승인' : '거부'
      alert(`✅ 콘텐츠가 ${actionText}되었습니다!`)
      closeReviewModal()
      router.refresh()
    } catch (error) {
      console.error('Error reviewing content:', error)
      alert('❌ 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 상태 뱃지
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    }

    const labels = {
      pending: '⏳ 대기',
      approved: '✅ 승인',
      rejected: '❌ 거부',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* 필터 & 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 검색 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="제목, 주제, 업로더 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          />
        </div>

        {/* 상태 필터 */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
        >
          <option value="all">전체 상태</option>
          <option value="pending">승인 대기</option>
          <option value="approved">승인됨</option>
          <option value="rejected">거부됨</option>
        </select>

        {/* 정렬 */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-')
            setSortBy(field as 'created_at' | 'title')
            setSortOrder(order as 'asc' | 'desc')
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
        >
          <option value="created_at-desc">최신 업로드순</option>
          <option value="created_at-asc">오래된 업로드순</option>
          <option value="title-asc">제목 가나다순</option>
          <option value="title-desc">제목 역순</option>
        </select>
      </div>

      {/* 결과 수 */}
      <div className="text-sm text-gray-600">
        총 {filteredMaterials.length}개 표시 중 (전체 {materials.length}개)
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                콘텐츠
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                업로더
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                통계
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                업로드일
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMaterials.map((material) => (
              <tr key={material.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-cobalt-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cobalt-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {material.title || '제목 없음'}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {material.subject} · {material.target_audience}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {material.uploader?.name || '알 수 없음'}
                    </div>
                    <div className="text-sm text-gray-500">
                      <RankBadge rank={material.uploader?.rank as InstructorRank} size="sm" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={material.status} />
                  {material.reviewed_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(material.reviewed_at).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      {material.usage_count || 0}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Download className="w-4 h-4" />
                      {material.download_count || 0}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-500">
                    {new Date(material.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {material.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openReviewModal(material, 'approve')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          승인
                        </button>
                        <button
                          onClick={() => openReviewModal(material, 'reject')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          거부
                        </button>
                      </>
                    )}
                    {material.status === 'approved' && (
                      <button
                        onClick={() => openReviewModal(material, 'reject')}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        거부
                      </button>
                    )}
                    {material.status === 'rejected' && (
                      <button
                        onClick={() => openReviewModal(material, 'approve')}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        승인
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 빈 상태 */}
      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📂</div>
          <p className="text-gray-500">검색 결과가 없습니다</p>
        </div>
      )}

      {/* 🔴 리뷰 모달 */}
      {modal.isOpen && modal.material && modal.action && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  콘텐츠 {modal.action === 'approve' ? '승인' : '거부'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {modal.material.title}
                </p>
              </div>
              <button
                onClick={closeReviewModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-6 space-y-6">
              {/* 콘텐츠 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">업로더</div>
                    <div className="font-medium">
                      {modal.material.uploader?.name} ({modal.material.uploader?.email})
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">주제</div>
                    <div className="font-medium">{modal.material.subject}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">대상</div>
                    <div className="font-medium">{modal.material.target_audience}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">업로드일</div>
                    <div className="font-medium">
                      {new Date(modal.material.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
                {modal.material.description && (
                  <div>
                    <div className="text-gray-600 text-sm mb-1">설명</div>
                    <div className="text-sm">{modal.material.description}</div>
                  </div>
                )}
              </div>

              {/* 검토 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  검토 메모 (선택사항)
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={modal.action === 'approve' 
                    ? "예: 우수한 교육 자료로 판단됨"
                    : "예: 저작권 문제로 거부"
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  업로더에게 전달되지 않으며, 관리 기록용입니다
                </p>
              </div>

              {/* 확인 메시지 */}
              <div className={`rounded-lg p-4 ${
                modal.action === 'approve' 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex gap-2">
                  <div className={`text-lg ${
                    modal.action === 'approve' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {modal.action === 'approve' ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${
                      modal.action === 'approve' ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {modal.action === 'approve' 
                        ? '이 콘텐츠를 승인하시겠습니까?'
                        : '이 콘텐츠를 거부하시겠습니까?'
                      }
                    </div>
                    <div className={`text-xs mt-1 ${
                      modal.action === 'approve' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {modal.action === 'approve' 
                        ? '승인 시 모든 사용자가 이 콘텐츠를 볼 수 있습니다'
                        : '거부 시 이 콘텐츠는 비공개 처리됩니다'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={closeReviewModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                onClick={handleReviewSubmit}
                className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  modal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? '처리 중...' 
                  : modal.action === 'approve' ? '승인하기' : '거부하기'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
