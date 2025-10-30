// src/components/admin/SeedDataTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Star, User, Calendar, Search } from 'lucide-react'

interface Material {
  id: string
  title: string
  filename: string
  is_seed_data: boolean
  usage_count: number
  download_count: number
  rating: number
  rating_count: number
  created_at: string
  seed_approved_at: string | null
  profiles: {
    name: string
    email: string
    rank: string
  }
  seed_approver: {
    name: string
    email: string
  } | null
}

interface SeedDataTableProps {
  materials: Material[]
}

export function SeedDataTable({ materials }: SeedDataTableProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'seed' | 'regular'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  // 필터링
  const filteredMaterials = materials.filter((material) => {
    // 시드 필터
    if (filter === 'seed' && !material.is_seed_data) return false
    if (filter === 'regular' && material.is_seed_data) return false

    // 검색
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        material.title.toLowerCase().includes(searchLower) ||
        material.profiles.name.toLowerCase().includes(searchLower) ||
        material.profiles.email.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  // 시드 지정/해제
  const handleToggleSeed = async (materialId: string, currentStatus: boolean) => {
    if (!confirm(
      currentStatus
        ? '시드 데이터에서 제외하시겠습니까?'
        : '이 자료를 시드 데이터로 지정하시겠습니까?'
    )) {
      return
    }

    setLoading(materialId)

    try {
      const response = await fetch(`/api/admin/seed-data/${materialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_seed_data: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update seed status')
      }

      alert(currentStatus ? '✅ 시드에서 제외되었습니다' : '✅ 시드로 지정되었습니다')
      router.refresh()

    } catch (error) {
      console.error('Toggle seed error:', error)
      alert('❌ 변경에 실패했습니다')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      {/* 필터 & 검색 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 필터 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-cobalt-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({materials.length})
            </button>
            <button
              onClick={() => setFilter('seed')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'seed'
                  ? 'bg-gold-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌱 시드 ({materials.filter(m => m.is_seed_data).length})
            </button>
            <button
              onClick={() => setFilter('regular')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'regular'
                  ? 'bg-cobalt-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              일반 ({materials.filter(m => !m.is_seed_data).length})
            </button>
          </div>

          {/* 검색 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제목, 강사명으로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                제목
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                강사
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                사용량
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                평점
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {search ? '검색 결과가 없습니다' : '콘텐츠가 없습니다'}
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 truncate">
                        {material.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {material.filename}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {material.profiles.name || '이름 없음'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {material.profiles.rank}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm text-gray-900">
                      {material.usage_count + material.download_count}
                    </div>
                    <div className="text-xs text-gray-500">
                      사용+다운로드
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {material.rating_count > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {material.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({material.rating_count})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {material.is_seed_data ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-100 text-gold-700 text-xs font-medium rounded">
                          🌱 시드
                        </span>
                        {material.seed_approved_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(material.seed_approved_at).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">일반</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleSeed(material.id, material.is_seed_data)}
                      disabled={loading === material.id}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                        ${material.is_seed_data
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gold-500 text-white hover:bg-gold-600'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {loading === material.id ? (
                        '처리중...'
                      ) : material.is_seed_data ? (
                        '시드 해제'
                      ) : (
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          시드 지정
                        </span>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
