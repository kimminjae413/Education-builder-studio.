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
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.')
        } else {
          setError('회원가입 중 오류가 발생했습니다.')
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        // 2. profiles 테이블에 자동으로 생성됨 (트리거)
        // role은 기본값 'instructor'로 자동 설정됨
        
        // 3. 프로필에 이름 업데이트
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: formData.name })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('Profile update error:', profileError)
        }

        // 4. 로그인 페이지로 이동 (이메일 확인 필요 시)
        alert('회원가입이 완료되었습니다! 로그인해주세요.')
        router.push('/login')
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
        <p className="mt-1 text-xs text-gray-500">최소 6자 이상</p>
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

      {/* 안내 */}
      <p className="text-xs text-gray-500 text-center">
        회원가입 시 <span className="font-medium">강사(Instructor)</span> 계정이 생성됩니다.
      </p>
    </form>
  )
}
