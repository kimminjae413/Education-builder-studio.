// src/components/profile/ProfileEditForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Save, X } from 'lucide-react'

interface ProfileEditFormProps {
  profile: {
    id: string
    name: string | null
    phone: string | null
    bio: string | null
  }
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
  })

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
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          bio: formData.bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

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
