'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase/client'
import { onAuthStateChanged, User } from 'firebase/auth'

interface Material {
  id: string
  title: string
  description: string
  file_type: string
  target_category: string
  subject_category: string
  download_count: number
  rating: number
  user_name: string
  created_at: string
}

interface Category {
  id: string
  name: string
  description: string
  icon: string
  count: number
}

export default function LibraryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedCategory, sortBy])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 카테고리 및 자료 동시 로드
      const [catRes, matRes] = await Promise.all([
        fetch('/api/marketplace?action=categories'),
        fetch(`/api/marketplace?action=search&category=${selectedCategory}&sort=${sortBy}&limit=20`)
      ])

      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }

      if (matRes.ok) {
        const matData = await matRes.json()
        setMaterials(matData.listings || [])
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchData()
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace?action=search&q=${encodeURIComponent(searchQuery)}&sort=${sortBy}`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.listings || [])
      }
    } catch (error) {
      console.error('검색 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return '📄'
      case 'docx': case 'doc': return '📝'
      case 'pptx': case 'ppt': return '📊'
      case 'xlsx': case 'xls': return '📈'
      case 'hwp': return '📃'
      default: return '📁'
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 라이브러리</h1>
        <p className="text-gray-600">베테랑 강사들의 검증된 교육 자료를 검색하고 활용하세요</p>
      </div>

      {/* 검색 바 */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="교육 자료 검색 (예: 아두이노, 코딩, 초등학생...)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
        </div>

        {/* 필터 */}
        <div className="flex gap-4 mt-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">모든 카테고리</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name} ({cat.count})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="newest">최신순</option>
            <option value="popular">인기순</option>
            <option value="rating">평점순</option>
            <option value="downloads">다운로드순</option>
          </select>
        </div>
      </div>

      {/* 카테고리 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
            className={`p-4 rounded-xl border text-center transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-50 border-blue-300'
                : 'bg-white border-gray-200 hover:border-blue-200'
            }`}
          >
            <div className="text-2xl mb-1">{cat.icon}</div>
            <div className="text-sm font-medium text-gray-900">{cat.name}</div>
            <div className="text-xs text-gray-500">{cat.count}개</div>
          </button>
        ))}
      </div>

      {/* 자료 목록 */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            등록된 자료가 없습니다
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            아직 마켓플레이스에 등록된 교육 자료가 없습니다.<br />
            자료를 업로드하고 공유해보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getFileIcon(material.file_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {material.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {material.user_name || '익명'}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {material.description || '설명이 없습니다.'}
                </p>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  {material.target_category && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      {material.target_category}
                    </span>
                  )}
                  {material.subject_category && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                      {material.subject_category}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>⬇️ {material.download_count || 0}</span>
                    <span>⭐ {material.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <button className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    상세보기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 자료 업로드 유도 */}
      {user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">교육 자료를 공유해보세요!</h3>
              <p className="text-sm text-gray-600 mt-1">
                자료를 공유하면 포인트를 받고 다른 강사들에게 도움이 됩니다.
              </p>
            </div>
            <a
              href="/upload"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              자료 업로드
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
