'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        return
      }

      if (data.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 animate-shake">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 이메일 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-cobalt-500 focus:border-transparent 
                   transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="example@email.com"
          disabled={loading}
        />
      </div>

      {/* 비밀번호 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-cobalt-500 focus:border-transparent 
                   transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {/* 로그인 버튼 - ⭐ 강력한 시각적 피드백 */}
      <button
        type="submit"
        disabled={loading}
        className={`
          w-full py-3 px-4 rounded-lg font-medium 
          transition-all shadow-cobalt-md
          flex items-center justify-center gap-2
          ${loading 
            ? 'bg-cobalt-400 cursor-wait' 
            : 'bg-cobalt-500 hover:bg-cobalt-600 hover:shadow-cobalt-lg active:scale-95'
          }
          text-white
          disabled:cursor-not-allowed
          transform
        `}
      >
        {loading ? (
          <>
            {/* 회전하는 스피너 */}
            <svg 
              className="animate-spin h-5 w-5 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>로그인 중...</span>
          </>
        ) : (
          <span>로그인</span>
        )}
      </button>
    </form>
  )
}
