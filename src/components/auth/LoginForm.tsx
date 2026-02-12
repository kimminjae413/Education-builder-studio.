'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getIdToken } from '@/lib/firebase/auth'

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
      const trimmedEmail = email.trim().toLowerCase()

      const result = await signIn(trimmedEmail, password)

      if (result.error) {
        console.error('🔴 Login error:', result.error)

        if (result.error.includes('user-not-found')) {
          setError('등록되지 않은 이메일입니다.')
        } else if (result.error.includes('wrong-password') || result.error.includes('invalid-credential')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (result.error.includes('invalid-email')) {
          setError('올바른 이메일 형식이 아닙니다.')
        } else if (result.error.includes('too-many-requests')) {
          setError('너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.')
        } else {
          setError(`로그인 실패: ${result.error}`)
        }
        return
      }

      if (result.user) {
        console.log('✅ Login success:', result.user.email)

        const token = await getIdToken()
        if (token) {
          // 쿠키를 클라이언트에서 직접 설정 (API 콜드스타트 대기 제거)
          document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`

          // 프로필 확인/생성은 백그라운드로 처리
          const userName = result.user.email?.split('@')[0] || ''
          fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` },
          }).then(async (profileRes) => {
            if (profileRes.status === 404) {
              await fetch('/api/profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: userName }),
              })
            }
          }).catch(() => {})
        }

        // router.push로 이동 (로딩 상태를 유지하며 대시보드 로딩)
        // window.location.href 대신 사용하면 "로그인 중..." 상태가 유지됨
        router.push('/dashboard')
        // 로딩 상태 유지 (setLoading(false) 하지 않음)
        return
      }
    } catch (err: any) {
      console.error('🔴 Unexpected error:', err)
      setError(`로그인 중 오류: ${err.message || '알 수 없는 오류'}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 animate-shake">
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
        </div>
      )}

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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100"
          placeholder="example@email.com"
          disabled={loading}
          autoComplete="email"
        />
      </div>

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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100"
          placeholder="••••••••"
          disabled={loading}
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all shadow-cobalt-md flex items-center justify-center gap-2 ${
          loading
            ? 'bg-cobalt-400 cursor-wait'
            : 'bg-cobalt-500 hover:bg-cobalt-600 hover:shadow-cobalt-lg active:scale-95'
        } text-white disabled:cursor-not-allowed transform`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
