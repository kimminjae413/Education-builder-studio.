// src/components/admin/SeedDataManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UploadResult {
  filename: string
  status: 'success' | 'failed'
  error?: string
  materialId?: string
}

interface SeedMaterial {
  id: string
  filename: string
  title: string
  subject_category: string
  target_category: string
  file_size: number
  created_at: string
}

export function SeedDataManager() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  
  // 기존 시드 데이터
  const [seedData, setSeedData] = useState<SeedMaterial[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)

  // 시드 데이터 로드
  useEffect(() => {
    loadSeedData()
  }, [])

  const loadSeedData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('teaching_materials')
        .select('id, filename, title, subject_category, target_category, file_size, created_at')
        .eq('is_seed_data', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSeedData(data || [])
    } catch (error) {
      console.error('Failed to load seed data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 파일 선택
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
    setUploadResults([])
  }

  // 업로드
  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/admin/seed-data/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (response.ok) {
          results.push({
            filename: file.name,
            status: 'success',
            materialId: data.materialId,
          })
        } else {
          results.push({
            filename: file.name,
            status: 'failed',
            error: data.error || 'Upload failed',
          })
        }
      } catch (error) {
        results.push({
          filename: file.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      const newProgress = ((i + 1) / files.length) * 100
      setProgress(newProgress)
      setUploadResults([...results])

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setUploading(false)
    loadSeedData() // 목록 새로고침
  }

  // 선택 토글
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === seedData.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(seedData.map(m => m.id)))
    }
  }

  // 삭제
  const handleDelete = async () => {
    if (selectedIds.size === 0) return
    
    if (!confirm(`선택한 ${selectedIds.size}개의 시드 데이터를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch('/api/admin/seed-data/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialIds: Array.from(selectedIds),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.deleted}개 삭제 완료${data.failed > 0 ? `\n❌ ${data.failed}개 실패` : ''}`)
        setSelectedIds(new Set())
        loadSeedData()
      } else {
        alert(`삭제 실패: ${data.error}`)
      }
    } catch (error) {
      alert(`삭제 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(false)
    }
  }

  const successCount = uploadResults.filter(r => r.status === 'success').length
  const failedCount = uploadResults.filter(r => r.status === 'failed').length

  return (
    <div className="space-y-8">
      {/* 업로드 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            새 시드 데이터 업로드
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {/* 파일 선택 */}
          <div>
            <input
              type="file"
              multiple
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {files.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {files.length}개 파일 선택됨
              </p>
            )}
          </div>

          {/* 업로드 버튼 */}
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
                     text-white font-medium py-3 px-4 rounded-lg
                     transition-colors disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {uploading ? '업로드 중...' : `${files.length}개 파일 업로드`}
          </button>

          {/* 진행률 */}
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                {Math.round(progress)}% 완료 ({uploadResults.length} / {files.length})
              </p>
            </div>
          )}

          {/* 결과 요약 */}
          {uploadResults.length > 0 && !uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{successCount}개 성공</span>
                </div>
                {failedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{failedCount}개 실패</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 기존 시드 데이터 관리 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            기존 시드 데이터 ({seedData.length}개)
          </h2>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 
                       text-white text-sm font-medium py-2 px-4 rounded-lg
                       transition-colors disabled:cursor-not-allowed
                       flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              선택 삭제 ({selectedIds.size}개)
            </button>
          )}
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-8">로딩 중...</p>
          ) : seedData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              아직 업로드된 시드 데이터가 없습니다
            </p>
          ) : (
            <div className="space-y-4">
              {/* 전체 선택 */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <input
                  type="checkbox"
                  checked={selectedIds.size === seedData.length && seedData.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">전체 선택</span>
              </div>

              {/* 목록 */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {seedData.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(material.id)}
                      onChange={() => toggleSelection(material.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {material.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {material.subject_category} · {material.target_category} · {(material.file_size / 1024).toFixed(0)}KB
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(material.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 경고 메시지 */}
      {selectedIds.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-800">
              <strong>{selectedIds.size}개</strong>의 시드 데이터가 선택되었습니다. 
              삭제하면 Storage 파일과 DB 데이터가 모두 영구 삭제됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
