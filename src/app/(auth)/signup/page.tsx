'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const [emailSent, setEmailSent] = useState(false) // ⭐ 이메일 발송 상태

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // 1. 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.')
        } else if (signUpError.message.includes('email')) {
          setError('유효하지 않은 이메일 주소입니다.')
        } else {
          setError('회원가입 중 오류가 발생했습니다: ' + signUpError.message)
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        // 2. 프로필에 이름 업데이트 시도
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: formData.name })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('Profile update error:', profileError)
        }

        // 3. ⭐ 이메일 확인이 필요한지 체크
        // authData.user.identities가 있으면 이메일 확인이 필요함
        if (authData.user.identities && authData.user.identities.length > 0) {
          // 이메일 확인 필요
          setEmailSent(true)
        } else {
          // 이메일 확인 불필요 (설정에서 OFF된 경우)
          alert('회원가입이 완료되었습니다! 로그인해주세요.')
          router.push('/login')
        }
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ⭐ 이메일 발송 완료 화면
  if (emailSent) {
    return (
      <div className="space-y-4">
        <div className="bg-cobalt-50 border-2 border-cobalt-200 rounded-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-cobalt-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            이메일을 확인해주세요! 📧
          </h3>
          
          <p className="text-gray-700 mb-4">
            <span className="font-medium text-cobalt-600">{formData.email}</span>로<br />
            인증 메일을 발송했습니다.
          </p>
          
          <div className="bg-white rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <strong className="text-gray-900">다음 단계:</strong>
            </p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>이메일 받은편지함을 확인하세요</li>
              <li>"Confirm your signup" 링크를 클릭하세요</li>
              <li>이메일 인증 후 로그인하세요</li>
            </ol>
          </div>
          
          <p className="text-xs text-gray-500">
            ⚠️ 메일이 오지 않았나요? 스팸함을 확인해주세요.
          </p>
        </div>

        <button
          onClick={() => router.push('/login')}
          className="w-full bg-cobalt-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-cobalt-600 transition-all"
        >
          로그인 페이지로 이동
        </button>
      </div>
    )
  }

  // 일반 회원가입 폼
  return (
    <form onSubmit={handleSignup} className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 이름 */}
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all"
          placeholder="홍길동"
          disabled={loading}
        />
      </div>

      {/* 이메일 */}
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all"
          placeholder="example@email.com"
          disabled={loading}
        />
      </div>

      {/* 비밀번호 */}
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all"
          placeholder="••••••••"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">최소 6자 이상</p>
      </div>

      {/* 비밀번호 확인 */}
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {/* 회원가입 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cobalt-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-cobalt-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-cobalt-md hover:shadow-cobalt-lg"
      >
        {loading ? '처리 중...' : '회원가입'}
      </button>
    </form>
  )
}
