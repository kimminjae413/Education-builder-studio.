// src/components/contribute/MyMaterials.tsx
'use client'

import { FileText, Download, Eye, Star, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Material {
  id: string
  title: string
  filename: string
  file_type: string
  file_size: number
  status: 'pending' | 'approved' | 'rejected'
  is_seed_data: boolean
  usage_count: number
  download_count: number
  rating: number
  rating_count: number
  created_at: string
}

interface MyMaterialsProps {
  materials: Material[]
}

export function MyMaterials({ materials }: MyMaterialsProps) {
  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
        <div className="text-4xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          아직 업로드한 콘텐츠가 없습니다
        </h3>
        <p className="text-gray-600">
          첫 번째 교육 자료를 공유해보세요!
        </p>
      </div>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            <CheckCircle className="h-3 w-3" />
            승인됨
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
            <Clock className="h-3 w-3" />
            승인 대기
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            <XCircle className="h-3 w-3" />
            거부됨
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          내가 올린 콘텐츠 ({materials.length})
        </h3>
      </div>

      <div className="space-y-3">
        {materials.map((material) => (
          <div
            key={material.id}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-cobalt-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              {/* 파일 아이콘 */}
              <div className="h-12 w-12 rounded-lg bg-cobalt-50 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-cobalt-600" />
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {material.title}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {material.filename}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(material.status)}
                    {material.is_seed_data && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-100 text-gold-700 text-xs font-medium rounded">
                        🌱 시드
                      </span>
                    )}
                  </div>
                </div>

                {/* 메타 정보 */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>{formatFileSize(material.file_size)}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(material.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* 통계 */}
                {material.status === 'approved' && (
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Eye className="h-4 w-4" />
                      <span>{material.usage_count}</span>
                      <span className="text-xs">사용</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Download className="h-4 w-4" />
                      <span>{material.download_count}</span>
                      <span className="text-xs">다운로드</span>
                    </div>
                    {material.rating_count > 0 && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
                        <span>{material.rating.toFixed(1)}</span>
                        <span className="text-xs">({material.rating_count})</span>
                      </div>
                    )}
                  </div>
                )}

                {material.status === 'pending' && (
                  <p className="text-sm text-amber-600">
                    관리자 승인을 기다리고 있습니다
                  </p>
                )}

                {material.status === 'rejected' && (
                  <p className="text-sm text-red-600">
                    승인이 거부되었습니다. 관리자에게 문의하세요.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
