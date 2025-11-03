// src/components/design/RecommendedMaterials.tsx
'use client'

import { useEffect, useState } from 'react'
import { Download, Star, Loader2, FileText, BookOpen } from 'lucide-react'
import { RankBadge } from '@/components/rank/RankBadge'
import { InstructorRank } from '@/lib/rank/types'

interface Material {
  id: string
  filename: string
  title: string
  description: string | null
  subject_category: string
  target_category: string
  file_url: string
  file_type: string
  usage_count: number
  download_count: number
  recommendation_score: number
  profiles?: {
    name: string
    rank: InstructorRank
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
    async function fetchMaterials() {
      try {
        console.log(`📚 과정 ${courseId}의 추천 자료 조회 시작...`)
        
        const response = await fetch(`/api/courses/${courseId}/materials`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch materials')
        }
        
        const data = await response.json()
        console.log(`✅ ${data.count}개 자료 조회 완료:`, data)
        
        setMaterials(data.materials || [])
      } catch (err) {
        console.error('❌ Error fetching materials:', err)
        setError('추천 자료를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [courseId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cobalt-500" />
          <span className="ml-3 text-gray-600">관련 교육 자료를 찾는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📚 관련 교육 자료
        </h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">아직 추천할 자료가 없습니다</p>
          <p className="text-sm text-gray-500">
            더 많은 자료가 업로드되면 AI가 자동으로 관련 자료를 추천해드립니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            📚 이 과정과 관련된 교육 자료
          </h2>
          <p className="text-sm text-gray-500">
            베테랑 강사들이 제공한 검증된 자료 {materials.length}개
          </p>
        </div>
        <span className="px-3 py-1 bg-cobalt-50 text-cobalt-700 text-sm font-medium rounded-full border border-cobalt-200">
          🤖 AI 추천
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      console.log(`⬇️ 다운로드 시작: ${material.filename}`)
      
      // 다운로드 카운트 증가 (백그라운드)
      fetch(`/api/courses/${material.id}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId: material.id })
      }).catch(err => console.error('카운트 증가 실패:', err))

      // 파일 다운로드
      const a = document.createElement('a')
      a.href = material.file_url
      a.download = material.filename
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      console.log(`✅ 다운로드 완료: ${material.filename}`)
    } catch (error) {
      console.error('❌ Download error:', error)
      alert('다운로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setDownloading(false)
    }
  }

  // 파일 타입 아이콘
  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return '📄'
    if (fileType === 'pptx' || fileType === 'ppt') return '📊'
    if (fileType === 'docx' || fileType === 'doc') return '📝'
    return '📁'
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-cobalt-300 hover:shadow-md transition-all bg-white">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
            {material.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="truncate">
              👤 {material.profiles?.name || '익명'}
            </span>
            {material.profiles?.rank && (
              <RankBadge 
                rank={material.profiles.rank} 
                showLabel={false} 
                size="sm" 
              />
            )}
          </div>
        </div>
      </div>

      {/* 설명 */}
      {material.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
          {material.description}
        </p>
      )}

      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
          {getFileIcon(material.file_type)} {material.file_type.toUpperCase()}
        </span>
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
          {material.target_category}
        </span>
        {material.subject_category && (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
            {material.subject_category}
          </span>
        )}
      </div>

      {/* 통계 */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          <span>{material.download_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>{material.usage_count}회 사용</span>
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full px-3 py-2.5 text-sm bg-cobalt-500 text-white hover:bg-cobalt-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
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
  )
}
