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
      
      // 이메일 공백 제거
      const trimmedEmail = email.trim().toLowerCase()
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (signInError) {
        // 콘솔에 실제 에러 출력 (디버깅용)
        console.error('🔴 Login error:', signInError)
        console.error('🔴 Error message:', signInError.message)
        console.error('🔴 Error status:', signInError.status)
        
        // 구체적인 에러 메시지
        if (signInError.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 이메일함을 확인해주세요.')
        } else if (signInError.message.includes('Invalid email')) {
          setError('올바른 이메일 형식이 아닙니다.')
        } else if (signInError.message.includes('User not found')) {
          setError('등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.')
        } else if (signInError.status === 400) {
          setError(`입력 오류: ${signInError.message}`)
        } else {
          // 개발 중에는 실제 에러 메시지 표시
          setError(`로그인 실패: ${signInError.message}`)
        }
        return
      }

      if (data.user) {
        console.log('✅ Login success:', data.user.email)
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('🔴 Unexpected error:', err)
      setError(`로그인 중 오류: ${err.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 animate-shake">
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100"
          placeholder="example@email.com"
          disabled={loading}
          autoComplete="email"
        />
        <p className="mt-1 text-xs text-gray-500">
          입력 예: hong@dankook.ac.kr
        </p>
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100"
          placeholder="••••••••"
          disabled={loading}
          autoComplete="current-password"
        />
      </div>

      {/* 로그인 버튼 */}
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

      {/* 개발 모드 디버그 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 font-mono">
            디버그: 브라우저 콘솔(F12)에서 상세 에러를 확인하세요
          </p>
        </div>
      )}
    </form>
  )
}
