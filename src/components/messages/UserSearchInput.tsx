// src/components/messages/UserSearchInput.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { RankBadge } from '@/components/rank/RankBadge'

interface UserResult {
  id: string
  name: string
  rank: string
  profile_image_url: string | null
}

interface UserSearchInputProps {
  onSelect: (user: UserResult) => void
  token: string
  placeholder?: string
}

export function UserSearchInput({ onSelect, token, placeholder = '이름으로 검색...' }: UserSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<UserResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    // 300ms 디바운스
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      searchUsers(query)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const searchUsers = async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setResults(data.users || [])
        setIsOpen(true)
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (user: UserResult) => {
    setSelected(user)
    setQuery(user.name || '')
    setIsOpen(false)
    onSelect(user)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (selected) setSelected(null)
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none"
          readOnly={!!selected}
        />
        {(query || selected) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* 드롭다운 결과 */}
      {isOpen && !selected && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">검색 결과가 없습니다</div>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {user.profile_image_url ? (
                    <img src={user.profile_image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm text-gray-500">{(user.name || '?')[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                </div>
                <RankBadge rank={user.rank} size="sm" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
