// src/components/admin/SeedDataUpload.tsx
'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2, FolderOpen } from 'lucide-react'

interface UploadStatus {
  filename: string
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
  materialId?: string
}

export function SeedDataUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [dragActive, setDragActive] = useState(false)

  // 드래그 이벤트 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // 파일 드롭 핸들러
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      return ['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(ext || '')
    })

    setFiles(prev => [...prev, ...validFiles])
  }

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  // 파일 제거
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 전체 업로드 실행
  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadStatuses(files.map(f => ({ filename: f.name, status: 'pending' })))

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 상태 업데이트: 처리 중
      setUploadStatuses(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'processing' } : item
      ))

      try {
        // FormData 생성
        const formData = new FormData()
        formData.append('file', file)

        // API 호출
        const response = await fetch('/api/admin/seed-data/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (response.ok) {
          // 성공
          setUploadStatuses(prev => prev.map((item, idx) =>
            idx === i ? {
              ...item,
              status: 'success',
              message: '업로드 및 AI 분석 완료',
              materialId: result.materialId
            } : item
          ))
        } else {
          // 실패
          setUploadStatuses(prev => prev.map((item, idx) =>
            idx === i ? {
              ...item,
              status: 'error',
              message: result.error || '업로드 실패'
            } : item
          ))
        }
      } catch (error) {
        // 에러
        setUploadStatuses(prev => prev.map((item, idx) =>
          idx === i ? {
            ...item,
            status: 'error',
            message: '네트워크 오류'
          } : item
        ))
      }

      // 다음 파일로 넘어가기 전 잠시 대기 (API 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setUploading(false)
  }

  // 완료 후 초기화
  const handleReset = () => {
    setFiles([])
    setUploadStatuses([])
  }

  return (
    <div className="space-y-6">
      {/* 업로드 존 */}
      {uploadStatuses.length === 0 && (
        <div className="bg-white rounded-lg border p-8">
          {/* 드래그앤드롭 영역 */}
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-cobalt-500 bg-cobalt-50'
                : 'border-gray-300 bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              파일을 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-sm text-gray-500 mb-4">
              PDF, PPT, PPTX, DOC, DOCX 파일 지원
            </p>
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="px-6 py-3 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700 cursor-pointer inline-block">
                파일 선택
              </span>
            </label>
          </div>

          {/* 선택된 파일 목록 */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  선택된 파일 ({files.length}개)
                </h3>
                <button
                  onClick={() => setFiles([])}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  모두 제거
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700 ml-4"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 업로드 버튼 */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {uploading ? '업로드 중...' : `${files.length}개 파일 업로드 시작`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 업로드 진행 상황 */}
      {uploadStatuses.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              업로드 진행 상황
            </h3>
            {!uploading && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                새로 업로드
              </button>
            )}
          </div>

          {/* 진행 상태 요약 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {uploadStatuses.length}
              </div>
              <div className="text-xs text-gray-600">전체</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {uploadStatuses.filter(s => s.status === 'processing').length}
              </div>
              <div className="text-xs text-blue-600">처리 중</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {uploadStatuses.filter(s => s.status === 'success').length}
              </div>
              <div className="text-xs text-green-600">완료</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {uploadStatuses.filter(s => s.status === 'error').length}
              </div>
              <div className="text-xs text-red-600">실패</div>
            </div>
          </div>

          {/* 파일별 상태 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {uploadStatuses.map((status, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  status.status === 'success' ? 'bg-green-50 border-green-200' :
                  status.status === 'error' ? 'bg-red-50 border-red-200' :
                  status.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {status.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  {status.status === 'processing' && (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  )}
                  {status.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {status.status === 'error' && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {status.filename}
                    </p>
                    {status.message && (
                      <p className={`text-xs mt-1 ${
                        status.status === 'error' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {status.message}
                      </p>
                    )}
                  </div>
                </div>

                {status.status === 'success' && status.materialId && (
                  <a
                    href={`/library/${status.materialId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cobalt-600 hover:text-cobalt-700 font-medium ml-4"
                  >
                    보기 →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 사항 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          시드 데이터 업로드 가이드
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>지원 파일:</strong> PDF, PPT, PPTX, DOC, DOCX
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>자동 처리:</strong> AI가 파일 내용을 분석하여 자동으로 카테고리를 분류합니다
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>자동 승인:</strong> 시드 데이터는 자동으로 "승인됨" 상태로 저장됩니다
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>구글 드라이브 구조:</strong> EBS_DATA/EL001~EL010 폴더별로 업로드하면 자동으로 학년별로 분류됩니다
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
