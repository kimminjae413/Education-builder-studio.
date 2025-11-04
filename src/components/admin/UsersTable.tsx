// src/components/admin/UsersTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RankBadge } from '@/components/rank/RankBadge'
import { InstructorRank } from '@/lib/rank/types'
import { Search, Edit, X } from 'lucide-react'

interface UsersTableProps {
  users: any[]
}

interface RankEditModal {
  isOpen: boolean
  user: any | null
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [rankFilter, setRankFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'rank_points'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 🔴 랭크 수정 모달 상태
  const [modal, setModal] = useState<RankEditModal>({ isOpen: false, user: null })
  const [selectedRank, setSelectedRank] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // 🔴 랭크 수정 모달 열기
  const openRankModal = (user: any) => {
    setModal({ isOpen: true, user })
    setSelectedRank(user.rank)
    setReason(user.manual_rank_reason || '')
  }

  // 🔴 랭크 수정 모달 닫기
  const closeRankModal = () => {
    setModal({ isOpen: false, user: null })
    setSelectedRank('')
    setReason('')
    setIsSubmitting(false)
  }

  // 🔴 랭크 변경 제출
  const handleRankSubmit = async () => {
    if (!modal.user || !selectedRank) return

    if (!reason.trim()) {
      alert('변경 사유를 입력해주세요')
      return
    }

    setIsSubmitting(true)
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
        .eq('id', modal.user.id)

      if (error) throw error

      alert('✅ 랭크가 성공적으로 변경되었습니다!')
      closeRankModal()
      router.refresh()
    } catch (error) {
      console.error('Error updating rank:', error)
      alert('❌ 랭크 변경에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
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
      <div className="overflow-x-auto">
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
                  <button
                    onClick={() => openRankModal(user)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-cobalt-600 hover:bg-cobalt-700 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    랭크 수정
                  </button>
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

      {/* 🔴 랭크 수정 모달 */}
      {modal.isOpen && modal.user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">랭크 수정</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {modal.user.name || '이름 없음'} ({modal.user.email})
                </p>
              </div>
              <button
                onClick={closeRankModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
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
                    <RankBadge rank={modal.user.rank as InstructorRank} />
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">현재 포인트</div>
                    <div className="font-mono font-semibold">
                      {(modal.user.rank_points || 0).toLocaleString()}점
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
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  랭크 변경 이유를 기록으로 남겨주세요
                </p>
              </div>

              {/* 경고 메시지 */}
              {modal.user.manual_rank_override && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="text-amber-600 text-lg">⚠️</div>
                    <div className="flex-1">
                      <div className="font-medium text-amber-900 text-sm">
                        이미 수동 조정된 사용자입니다
                      </div>
                      <div className="text-xs text-amber-700 mt-1">
                        이전 사유: {modal.user.manual_rank_reason || '(기록 없음)'}
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
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                onClick={handleRankSubmit}
                className="flex-1 px-4 py-2.5 bg-cobalt-600 text-white font-medium rounded-lg hover:bg-cobalt-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !selectedRank || !reason.trim()}
              >
                {isSubmitting ? '변경 중...' : '랭크 변경'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
