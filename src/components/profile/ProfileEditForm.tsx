// src/components/profile/ProfileEditForm.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Save, X, Camera, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ProfileEditFormProps {
  profile: {
    id: string
    name: string | null
    phone: string | null
    bio: string | null
    profile_image_url?: string | null
  }
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.profile_image_url || null)
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('JPG, PNG, GIF, WebP 형식의 이미지만 업로드 가능합니다')
      return
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다')
      return
    }

    setImageLoading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '업로드 실패')
      }

      const data = await response.json()
      setPreviewUrl(data.imageUrl)
      alert('프로필 사진이 업로드되었습니다!')
      router.refresh()
    } catch (error) {
      console.error('Image upload error:', error)
      alert(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다')
    } finally {
      setImageLoading(false)
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImageDelete = async () => {
    if (!previewUrl) return

    if (!confirm('프로필 사진을 삭제하시겠습니까?')) return

    setImageLoading(true)

    try {
      const response = await fetch('/api/profile/upload-image', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('삭제 실패')
      }

      setPreviewUrl(null)
      alert('프로필 사진이 삭제되었습니다')
      router.refresh()
    } catch (error) {
      console.error('Image delete error:', error)
      alert('이미지 삭제에 실패했습니다')
    } finally {
      setImageLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요')
      return
    }

    // 핸드폰 번호 유효성 검사 (선택 사항)
    if (formData.phone.trim()) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        alert('올바른 핸드폰 번호 형식을 입력해주세요 (예: 010-1234-5678)')
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          bio: formData.bio.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      alert('프로필이 업데이트되었습니다! ✅')
      setIsEditing(false)
      
      // 강제 새로고침
      router.refresh()
      
      // 추가: 페이지 완전 리로드 (캐시 무시)
      setTimeout(() => {
        window.location.reload()
      }, 500)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('프로필 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      bio: profile.bio || '',
    })
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">프로필 편집</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-cobalt-600 hover:bg-cobalt-50 rounded-lg transition-colors"
          >
            <Pencil className="h-4 w-4" />
            편집
          </button>
        </div>
        <p className="text-sm text-gray-600">
          프로필 정보를 수정하려면 편집 버튼을 클릭하세요.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">프로필 편집</h3>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
        >
          <X className="h-4 w-4" />
          취소
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 프로필 사진 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            프로필 사진
          </label>
          <div className="flex items-center gap-4">
            {/* 미리보기 */}
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-cobalt-400 to-cobalt-600 flex items-center justify-center text-white flex-shrink-0">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="프로필 사진"
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-3xl font-bold">
                  {formData.name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
              {imageLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-cobalt-600 hover:bg-cobalt-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                {previewUrl ? '사진 변경' : '사진 업로드'}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleImageDelete}
                  disabled={imageLoading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  사진 삭제
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG, GIF, WebP 형식 / 최대 5MB
          </p>
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="홍길동"
            required
            maxLength={50}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all"
          />
        </div>

        {/* 핸드폰 번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            핸드폰 번호
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="010-1234-5678"
            maxLength={13}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">
            하이픈(-) 포함 또는 제외하고 입력 가능합니다
          </p>
        </div>

        {/* 자기소개 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            자기소개
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="간단한 자기소개를 작성해주세요"
            rows={4}
            maxLength={500}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:border-transparent resize-none transition-all"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {formData.bio.length}/500
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cobalt-600 text-white font-medium rounded-lg hover:bg-cobalt-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            {loading ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
