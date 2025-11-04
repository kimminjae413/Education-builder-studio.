// src/components/admin/UsersTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RankBadge } from '@/components/rank/RankBadge'
import { InstructorRank } from '@/lib/rank/types'
import { Search, ChevronDown, Edit } from 'lucide-react'

interface UsersTableProps {
  users: any[]
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [rankFilter, setRankFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'rank_points'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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

  const handleRankChange = async (userId: string, newRank: string) => {
    const reason = prompt('랭크 변경 사유를 입력하세요:')
    if (!reason) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          rank: newRank,
          manual_rank_override: true,
          manual_rank_reason: reason,
          rank_updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      alert('랭크가 변경되었습니다! ✅')
      router.refresh()
    } catch (error) {
      console.error('Error updating rank:', error)
      alert('랭크 변경에 실패했습니다.')
    }
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
          <option value="newcomer">새싹</option>
          <option value="junior">초급</option>
          <option value="intermediate">중급</option>
          <option value="senior">고급</option>
          <option value="veteran">베테랑</option>
          <option value="master">마스터</option>
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
                    <div className="text-xs text-amber-600 mt-1">
                      수동 조정됨
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
                    onClick={() => {
                      const newRank = prompt(
                        '새로운 랭크를 입력하세요:\nnewcomer, junior, intermediate, senior, veteran, master',
                        user.rank
                      )
                      if (newRank && ['newcomer', 'junior', 'intermediate', 'senior', 'veteran', 'master'].includes(newRank)) {
                        handleRankChange(user.id, newRank)
                      } else if (newRank) {
                        alert('올바른 랭크를 입력하세요')
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-cobalt-600 hover:bg-cobalt-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    수정
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
    </div>
  )
}
