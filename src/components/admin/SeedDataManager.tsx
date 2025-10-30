// src/components/admin/SeedDataManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Trash2, 
  AlertTriangle,
  FileText 
} from 'lucide-react'
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            새 시드 데이터 업로드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                disabled:opacity-50"
            />
            {files.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {files.length}개 파일 선택됨
              </p>
            )}
          </div>

          {/* 업로드 버튼 */}
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? '업로드 중...' : `${files.length}개 파일 업로드`}
          </Button>

          {/* 진행률 */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-gray-600 text-center">
                {Math.round(progress)}% 완료 ({uploadResults.length} / {files.length})
              </p>
            </div>
          )}

          {/* 결과 요약 */}
          {uploadResults.length > 0 && !uploading && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">{successCount}개 성공</span>
                  </div>
                  {failedCount > 0 && (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold">{failedCount}개 실패</span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 기존 시드 데이터 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              기존 시드 데이터 ({seedData.length}개)
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                선택 삭제 ({selectedIds.size}개)
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                <Checkbox
                  checked={selectedIds.size === seedData.length && seedData.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">전체 선택</span>
              </div>

              {/* 목록 */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {seedData.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedIds.has(material.id)}
                      onCheckedChange={() => toggleSelection(material.id)}
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
        </CardContent>
      </Card>

      {/* 경고 메시지 */}
      {selectedIds.size > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{selectedIds.size}개</strong>의 시드 데이터가 선택되었습니다. 
            삭제하면 Storage 파일과 DB 데이터가 모두 영구 삭제됩니다.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
