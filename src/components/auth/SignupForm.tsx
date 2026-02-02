'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, getIdToken } from '@/lib/firebase/auth'

export function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      const cleanEmail = formData.email.trim().toLowerCase()

      const result = await signUp(cleanEmail, formData.password)

      if (result.error) {
        console.error('🔴 Signup error:', result.error)

        if (result.error.includes('email-already-in-use')) {
          setError('⚠️ 이미 가입된 이메일입니다. 로그인 페이지로 이동합니다.')
          setTimeout(() => router.push('/login'), 2000)
        } else if (result.error.includes('invalid-email')) {
          setError('올바른 이메일 형식이 아닙니다.')
        } else if (result.error.includes('weak-password')) {
          setError('비밀번호가 너무 약합니다. 최소 6자 이상 입력하세요.')
        } else {
          setError(`회원가입 오류: ${result.error}`)
        }
        setLoading(false)
        return
      }

      if (result.user) {
        console.log('✅ Signup success:', result.user.email)

        // 프로필 생성 API 호출
        const token = await getIdToken()
        if (token) {
          document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`

          // 프로필에 이름 저장
          await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name: formData.name }),
          })
        }

        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('🔴 Unexpected error:', err)
      setError(`회원가입 중 오류: ${err.message || '알 수 없는 오류'}`)
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border-2 border-red-500 shadow-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 font-semibold flex-1">{error}</p>
          </div>
        </div>
      )}

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-cobalt-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600 font-medium">처리 중...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100"
              placeholder="홍길동"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100"
              placeholder="example@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-gray-500">최소 6자 이상</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="new-password"
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
                <span>처리 중...</span>
              </>
            ) : (
              <span>회원가입</span>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            회원가입 시 <span className="font-medium">강사(Instructor)</span> 계정이 생성됩니다.
          </p>
        </form>
      </div>
    </>
  )
}
