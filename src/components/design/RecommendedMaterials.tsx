// src/components/design/RecommendedMaterials.tsx
'use client'

import { useEffect, useState } from 'react'
import { Download, ExternalLink, Star, Loader2, FileText, AlertCircle } from 'lucide-react'

interface Material {
  id: string
  filename: string
  title: string
  description: string
  subject_category: string
  target_category: string
  file_url: string
  file_type: string
  similarity?: number
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
        const response = await fetch(`/api/courses/${courseId}/materials`)
        if (!response.ok) {
          throw new Error('Failed to fetch materials')
        }
        
        const data = await response.json()
        setMaterials(data.materials || [])
      } catch (err) {
        console.error('Error fetching materials:', err)
        setError('추천 자료를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [courseId])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-cobalt-50 to-blue-50 rounded-lg border border-cobalt-200 p-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-cobalt-600" />
          <span className="ml-3 text-gray-600 font-medium">
            AI가 관련 자료를 찾고 있습니다...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-8">
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            관련 교안 자료가 아직 없습니다
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            이 설계안과 유사한 베테랑 강사의 자료가 업로드되면
          </p>
          <p className="text-sm text-gray-600">
            자동으로 추천됩니다! 🎯
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-cobalt-50 to-blue-50 rounded-lg border border-cobalt-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-cobalt-600 fill-cobalt-600" />
        <h2 className="text-xl font-bold text-gray-900">
          이 설계안과 관련있는 교안 자료
        </h2>
        <span className="px-2 py-0.5 bg-cobalt-600 text-white rounded-full text-sm font-medium">
          {materials.length}개
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        AI가 설계안 내용을 분석하여 유사한 베테랑 강사의 검증된 자료를 자동으로 추천했습니다
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => (
          <MaterialCard key={material.id} material={material} />
        ))}
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg border border-cobalt-200">
        <p className="text-xs text-gray-600 text-center">
          💡 <strong>Tip:</strong> 이 자료들은 실제 수업에서 검증된 베테랑 강사의 콘텐츠입니다.
          자유롭게 다운로드하여 수업에 활용하세요!
        </p>
      </div>
    </div>
  )
}

function MaterialCard({ material }: { material: Material }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(material.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = material.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('다운로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setDownloading(false)
    }
  }

  const similarityPercent = material.similarity 
    ? Math.round(material.similarity * 100) 
    : null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-cobalt-500 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1">
          <div className="p-2 bg-cobalt-100 rounded flex-shrink-0">
            <FileText className="h-5 w-5 text-cobalt-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 break-words">
              {material.title || material.filename}
            </h3>
          </div>
        </div>
        
        {similarityPercent && similarityPercent >= 70 && (
          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">
            {similarityPercent}%
          </span>
        )}
      </div>
      
      {material.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
          {material.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          {material.subject_category}
        </span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
          {material.target_category}
        </span>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
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
        
        
          href={material.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors flex items-center justify-center"
          title="새 탭에서 열기"
        >
          <ExternalLink className="h-4 w-4 text-gray-600" />
        </a>
      </div>
    </div>
  )
}
