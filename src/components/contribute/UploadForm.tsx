// src/components/contribute/UploadForm.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'

interface UploadFormProps {
  profile: any
}

export function UploadForm({ profile }: UploadFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetCategory: '',
    subjectCategory: '',
  })

  // 파일 선택
  const handleFileSelect = (selectedFile: File) => {
    // 파일 크기 검증 (50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      alert('파일 크기는 50MB를 초과할 수 없습니다')
      return
    }

    setFile(selectedFile)
    
    // 제목 자동 설정
    if (!formData.title) {
      setFormData({
        ...formData,
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
      })
    }
  }

  // 드래그 앤 드롭
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0])
    }
  }

  // 파일 제거
  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 업로드
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      alert('파일을 선택해주세요')
      return
    }

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요')
      return
    }

    setUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('title', formData.title)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('target_category', formData.targetCategory)
      uploadFormData.append('subject_category', formData.subjectCategory)

      const response = await fetch('/api/materials/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '업로드 실패')
      }

      alert('✅ 파일이 성공적으로 업로드되었습니다!\n승인 후 공개됩니다.')
      
      // 폼 초기화
      setFile(null)
      setFormData({
        title: '',
        description: '',
        targetCategory: '',
        subjectCategory: '',
      })
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      router.refresh()

    } catch (error: any) {
      console.error('Upload error:', error)
      alert('❌ 업로드 실패: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">새 콘텐츠 업로드</h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 파일 드래그 앤 드롭 영역 */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${isDragging 
              ? 'border-cobalt-500 bg-cobalt-50' 
              : 'border-gray-300 hover:border-cobalt-400'
            }
            ${file ? 'bg-green-50 border-green-300' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.hwp,.zip,.jpg,.jpeg,.png"
            className="hidden"
          />

          {!file ? (
            <>
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-900 mb-1">
                파일을 드래그하거나 클릭하여 선택
              </p>
              <p className="text-sm text-gray-600 mb-4">
                PDF, DOCX, PPTX, XLSX, HWP, ZIP, 이미지 (최대 50MB)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700 transition-colors"
              >
                파일 선택
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="예: 아두이노 기초 과정"
            required
            maxLength={200}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            설명
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="자료에 대한 간단한 설명을 입력하세요"
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500 resize-none"
          />
        </div>

        {/* 카테고리 */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              대상
            </label>
            <select
              value={formData.targetCategory}
              onChange={(e) => setFormData({ ...formData, targetCategory: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
            >
              <option value="">선택 안 함</option>
              <option value="유아">유아</option>
              <option value="초등 저학년">초등 저학년 (1~3학년)</option>
              <option value="초등 고학년">초등 고학년 (4~6학년)</option>
              <option value="중학생">중학생</option>
              <option value="고등학생">고등학생</option>
              <option value="대학생">대학생</option>
              <option value="성인">성인</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주제
            </label>
            <select
              value={formData.subjectCategory}
              onChange={(e) => setFormData({ ...formData, subjectCategory: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
            >
              <option value="">선택 안 함</option>
              <option value="코딩">코딩</option>
              <option value="AI">AI/인공지능</option>
              <option value="메이커">메이커</option>
              <option value="로봇">로봇</option>
              <option value="3D프린팅">3D프린팅</option>
              <option value="드론">드론</option>
              <option value="IoT">IoT</option>
              <option value="앱개발">앱개발</option>
              <option value="게임개발">게임개발</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">업로드 안내</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>업로드된 자료는 관리자 승인 후 공개됩니다</li>
                <li>승인된 자료는 다른 강사들이 다운로드할 수 있습니다</li>
                <li>자료 사용량에 따라 랭크 포인트와 리워드를 받습니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!file || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cobalt-600 text-white font-medium rounded-lg hover:bg-cobalt-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="h-5 w-5" />
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </form>
    </div>
  )
}
