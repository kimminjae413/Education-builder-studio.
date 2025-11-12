// src/components/admin/UsersTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RankBadge } from '@/components/rank/RankBadge'
import { InstructorRank } from '@/lib/rank/types'
import { Search, Edit, X, Trash2, AlertTriangle } from 'lucide-react'

interface UsersTableProps {
  users: any[]
}

interface RankEditModal {
  isOpen: boolean
  user: any | null
}

interface DeleteModal {
  isOpen: boolean
  user: any | null
}

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [rankFilter, setRankFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'rank_points'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 랭크 수정 모달 상태
  const [rankModal, setRankModal] = useState<RankEditModal>({ isOpen: false, user: null })
  const [selectedRank, setSelectedRank] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [isSubmittingRank, setIsSubmittingRank] = useState(false)

  // ⭐ 탈퇴 모달 상태
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ isOpen: false, user: null })
  const [isDeleting, setIsDeleting] = useState(false)

  // 필터링된 사용자
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRank = rankFilter === 'all' || user.rank === rankFilter

      return matchesSearch && matchesRank
    })
    .sort((a, b) => {
      const aVal = sortBy === 'created_at' 
        ? new Date(a.created_at).getTime() 
        : (a.rank_points || 0)
      const bVal = sortBy === 'created_at' 
        ? new Date(b.created_at).getTime() 
        : (b.rank_points || 0)

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

  // 랭크 수정 모달 열기
  const openRankModal = (user: any) => {
    setRankModal({ isOpen: true, user })
    setSelectedRank(user.rank)
    setReason(user.manual_rank_reason || '')
  }

  // 랭크 수정 모달 닫기
  const closeRankModal = () => {
    setRankModal({ isOpen: false, user: null })
    setSelectedRank('')
    setReason('')
    setIsSubmittingRank(false)
  }

  // 랭크 변경 제출
  const handleRankSubmit = async () => {
    if (!rankModal.user || !selectedRank) return

    if (!reason.trim()) {
      alert('변경 사유를 입력해주세요')
      return
    }

    setIsSubmittingRank(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          rank: selectedRank,
          manual_rank_override: true,
          manual_rank_reason: reason.trim(),
          rank_updated_at: new Date().toISOString(),
        })
        .eq('id', rankModal.user.id)

      if (error) throw error

      alert('✅ 랭크가 성공적으로 변경되었습니다!')
      closeRankModal()
      router.refresh()
    } catch (error) {
      console.error('Error updating rank:', error)
      alert('❌ 랭크 변경에 실패했습니다.')
    } finally {
      setIsSubmittingRank(false)
    }
  }

  // ⭐ 탈퇴 모달 열기
  const openDeleteModal = (user: any) => {
    setDeleteModal({ isOpen: true, user })
  }

  // ⭐ 탈퇴 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null })
    setIsDeleting(false)
  }

  // ⭐ 회원 탈퇴 처리
  const handleDeleteUser = async () => {
    if (!deleteModal.user) return

    setIsDeleting(true)

    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteModal.user.id })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '삭제 실패')
      }

      alert(`✅ ${data.message}`)
      
      // 목록에서 제거
      setUsers(users.filter(u => u.id !== deleteModal.user!.id))
      closeDeleteModal()
      
      // 페이지 새로고침
      router.refresh()
    } catch (error: any) {
      alert(`❌ ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const rankOptions = [
    { value: 'newcomer', label: '🌱 새싹', description: '0 ~ 99점' },
    { value: 'junior', label: '📘 초급', description: '100 ~ 499점' },
    { value: 'intermediate', label: '📗 중급', description: '500 ~ 1,999점' },
    { value: 'senior', label: '📕 고급', description: '2,000 ~ 4,999점' },
    { value: 'veteran', label: '🏆 베테랑', description: '5,000 ~ 9,999점' },
    { value: 'master', label: '💎 마스터', description: '10,000점 이상' },
  ]

  return (
    <div className="space-y-4">
      {/* 필터 & 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 검색 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          />
        </div>

        {/* 랭크 필터 */}
        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
        >
          <option value="all">전체 랭크</option>
          {rankOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* 정렬 */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-')
            setSortBy(field as 'created_at' | 'rank_points')
            setSortOrder(order as 'asc' | 'desc')
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
        >
          <option value="created_at-desc">최신 가입순</option>
          <option value="created_at-asc">오래된 가입순</option>
          <option value="rank_points-desc">포인트 높은순</option>
          <option value="rank_points-asc">포인트 낮은순</option>
        </select>
      </div>

      {/* 결과 수 */}
      <div className="text-sm text-gray-600">
        총 {filteredUsers.length}명 표시 중 (전체 {users.length}명)
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                사용자
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                랭크
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                포인트
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                콘텐츠
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                가입일
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.name || '이름 없음'}
                      {user.role === 'admin' && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">
                          관리자
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RankBadge rank={user.rank as InstructorRank} size="sm" />
                  {user.manual_rank_override && (
                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      ✏️ 수동 조정됨
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-sm">
                    {(user.rank_points || 0).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    {user.teaching_materials?.length || 0}개
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* 랭크 수정 버튼 */}
                    <button
                      onClick={() => openRankModal(user)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-cobalt-600 hover:bg-cobalt-700 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      랭크
                    </button>

                    {/* ⭐ 탈퇴 버튼 (관리자 제외) */}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="회원 탈퇴"
                      >
                        <Trash2 className="h-4 w-4" />
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
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <p className="text-gray-500">검색 결과가 없습니다</p>
        </div>
      )}

      {/* ============================================ */}
      {/* 랭크 수정 모달 */}
      {/* ============================================ */}
      {rankModal.isOpen && rankModal.user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">랭크 수정</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {rankModal.user.name || '이름 없음'} ({rankModal.user.email})
                </p>
              </div>
              <button
                onClick={closeRankModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmittingRank}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-6 space-y-6">
              {/* 현재 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">현재 랭크</div>
                    <RankBadge rank={rankModal.user.rank as InstructorRank} />
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">현재 포인트</div>
                    <div className="font-mono font-semibold">
                      {(rankModal.user.rank_points || 0).toLocaleString()}점
                    </div>
                  </div>
                </div>
              </div>

              {/* 새 랭크 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  새 랭크 선택 *
                </label>
                <div className="space-y-2">
                  {rankOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${selectedRank === option.value
                          ? 'border-cobalt-500 bg-cobalt-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="rank"
                          value={option.value}
                          checked={selectedRank === option.value}
                          onChange={(e) => setSelectedRank(e.target.value)}
                          className="h-4 w-4 text-cobalt-600"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      {selectedRank === option.value && (
                        <div className="text-cobalt-600 text-xl">✓</div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* 변경 사유 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  변경 사유 *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="예: 특별 기여 인정으로 승급"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  disabled={isSubmittingRank}
                />
                <p className="text-xs text-gray-500 mt-1">
                  랭크 변경 이유를 기록으로 남겨주세요
                </p>
              </div>

              {/* 경고 메시지 */}
              {rankModal.user.manual_rank_override && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="text-amber-600 text-lg">⚠️</div>
                    <div className="flex-1">
                      <div className="font-medium text-amber-900 text-sm">
                        이미 수동 조정된 사용자입니다
                      </div>
                      <div className="text-xs text-amber-700 mt-1">
                        이전 사유: {rankModal.user.manual_rank_reason || '(기록 없음)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={closeRankModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isSubmittingRank}
              >
                취소
              </button>
              <button
                onClick={handleRankSubmit}
                className="flex-1 px-4 py-2.5 bg-cobalt-600 text-white font-medium rounded-lg hover:bg-cobalt-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmittingRank || !selectedRank || !reason.trim()}
              >
                {isSubmittingRank ? '변경 중...' : '랭크 변경'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ⭐ 회원 탈퇴 모달 */}
      {/* ============================================ */}
      {deleteModal.isOpen && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* 헤더 */}
            <div className="bg-red-50 border-b border-red-200 p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    회원 탈퇴 확인
                  </h3>
                  <p className="text-sm text-red-700">
                    이 작업은 되돌릴 수 없습니다
                  </p>
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">탈퇴할 사용자</div>
                <div className="font-semibold text-gray-900 text-lg">
                  {deleteModal.user.name || '이름 없음'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {deleteModal.user.email}
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-2">⚠️ 다음 데이터가 완전히 삭제됩니다:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>사용자 계정 정보 (auth.users)</li>
                      <li>프로필 정보 (profiles)</li>
                      <li>업로드한 모든 교육 자료</li>
                      <li>생성한 교육과정</li>
                      <li>댓글 및 피드백</li>
                    </ul>
                    <p className="mt-3 font-semibold">
                      ✅ 탈퇴 후 동일한 이메일로 재가입 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>탈퇴 처리 중...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>탈퇴 처리</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
