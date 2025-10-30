// src/components/design/RecommendedMaterials.tsx
'use client'

import { useEffect, useState } from 'react'
import { Download, Eye, Bookmark, Star, Loader2 } from 'lucide-react'
import { RankBadge } from '@/components/rank/RankBadge'

interface Material {
  id: string
  title: string
  description: string
  filename: string
  thumbnail_url?: string
  target_category: string
  tool_categories: string[]
  usage_count: number
  download_count: number
  bookmark_count: number
  rating: number
  rating_count: number
  recommendation_score: number
  profiles: {
    name: string
    rank: string
  }
}

interface RecommendedMaterialsProps {
  courseId: string
}

export function RecommendedMaterials({ courseId }: RecommendedMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await fetch(`/api/courses/${courseId}/recommendations`)
        if (!response.ok) throw new Error('Failed to fetch recommendations')
        
        const data = await response.json()
        setMaterials(data.recommendations || [])
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError('추천 자료를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [courseId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cobalt-500" />
          <span className="ml-3 text-gray-600">추천 자료를 찾는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-8">
        <div className="text-center py-8">
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📚 연관 교육 자료
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600">아직 추천할 자료가 없습니다.</p>
          <p className="text-sm text-gray-500 mt-2">
            더 많은 자료가 업로드되면 추천을 받을 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          📚 이 과정과 연관된 교육 자료 ({materials.length}개)
        </h2>
        <span className="text-sm text-gray-500">
          AI 추천 기반
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materials.map((material) => (
          <MaterialCard key={material.id} material={material} />
        ))}
      </div>
    </div>
  )
}

function MaterialCard({ material }: { material: Material }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/materials/${material.id}/download`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = material.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('다운로드에 실패했습니다')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-cobalt-300 hover:shadow-md transition-all">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {material.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>👤 {material.profiles?.name || '익명'}</span>
            <RankBadge rank={material.profiles?.rank as any} showLabel={false} size="sm" />
          </div>
        </div>
        
        {material.recommendation_score > 70 && (
          <span className="px-2 py-1 bg-gold-50 text-gold-600 text-xs font-semibold rounded-full border border-gold-200">
            추천
          </span>
        )}
      </div>

      {/* 설명 */}
      {material.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {material.description}
        </p>
      )}

      {/* 태그 */}
      {material.tool_categories && material.tool_categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {material.tool_categories.slice(0, 3).map((tool, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-cobalt-50 text-cobalt-700 text-xs rounded"
            >
              #{tool}
            </span>
          ))}
        </div>
      )}

      {/* 통계 */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-gold-500 fill-gold-500" />
          <span>{material.rating.toFixed(1)}</span>
          {material.rating_count > 0 && (
            <span className="text-gray-400">({material.rating_count})</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          <span>{material.download_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <Bookmark className="h-3 w-3" />
          <span>{material.bookmark_count}</span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <a
          href={`/library/${material.id}`}
          className="flex-1 px-3 py-2 text-sm text-center border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          미리보기
        </a>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 px-3 py-2 text-sm bg-cobalt-500 text-white hover:bg-cobalt-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>다운로드 중...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>다운로드</span>
            </>
          )}
        </button>
      </div>

      {/* 추천 점수 (디버깅용 - 나중에 제거 가능) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          매칭 점수: {material.recommendation_score}
        </div>
      )}
    </div>
  )
}
