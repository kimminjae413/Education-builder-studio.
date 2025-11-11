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
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')

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
      
      // 이메일 정리
      const cleanEmail = formData.email.trim().toLowerCase()
      
      console.log('🔍 회원가입 시도:', cleanEmail)
      
      // ⭐ STEP 0: 먼저 이메일 중복 체크 (profiles 테이블에서)
      console.log('🔍 이메일 중복 체크 중...')
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ 이메일 중복 체크 실패:', checkError)
      }
      
      if (existingProfile) {
        console.warn('⚠️ 이미 가입된 이메일:', cleanEmail)
        setLoading(false) // ⭐ 먼저 로딩 해제!
        setError('⚠️ 이미 가입된 이메일입니다. 3초 후 로그인 페이지로 이동합니다.')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
        return // ⭐ 여기서 함수 종료
      }
      
      console.log('✅ 이메일 사용 가능, 회원가입 진행')
      
      // ⭐ STEP 1: 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
          emailRedirectTo: `https://educationbuilderstudio.netlify.app/auth/callback`,
        },
      })

      console.log('📊 회원가입 응답:', {
        user: authData?.user?.id,
        email: authData?.user?.email,
        emailConfirmedAt: authData?.user?.email_confirmed_at,
        session: authData?.session ? 'exists' : 'null',
        error: signUpError
      })

      // 에러 처리
      if (signUpError) {
        console.error('🔴 회원가입 에러:', signUpError)
        
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('User already registered')) {
          setError('⚠️ 이미 가입된 이메일입니다. 3초 후 로그인 페이지로 이동합니다.')
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        } else if (signUpError.message.includes('Invalid email')) {
          setError('올바른 이메일 형식이 아닙니다.')
        } else if (signUpError.message.includes('Password')) {
          setError('비밀번호가 요구사항을 충족하지 않습니다. (최소 6자)')
        } else {
          setError(`회원가입 오류: ${signUpError.message}`)
        }
        setLoading(false)
        return
      }

      // User 객체 처리
      if (authData.user) {
        console.log('✅ User 객체 수신')
        
        // ⭐ STEP 2: 프로필 업데이트
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: formData.name })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('❌ 프로필 업데이트 실패:', profileError)
        } else {
          console.log('✅ 프로필에 이름 저장 완료')
        }

        // ⭐ STEP 3: 이메일 인증 필요 여부 확인
        if (authData.session) {
          // 바로 로그인됨 (이메일 인증 비활성화 상태)
          console.log('✅ 즉시 로그인, 대시보드로 이동')
          router.push('/dashboard')
        } else {
          // 이메일 인증 필요 (정상적인 신규 가입)
          console.log('📧 이메일 인증 필요, 안내 화면 표시')
          setUserEmail(cleanEmail)
          setSuccess(true)
        }
      } else {
        console.error('🔴 User 객체가 반환되지 않음')
        setError('회원가입 처리 중 문제가 발생했습니다.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('🔴 예상치 못한 에러:', err)
      setError(`회원가입 중 오류: ${err.message || '알 수 없는 오류'}`)
      setLoading(false)
    }
  }

  // ✅ 성공 화면 (이메일 인증 안내)
  if (success) {
    return (
      <div className="space-y-6">
        {/* 이메일 아이콘 */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            거의 다 왔습니다! 🎉
          </h3>
          <p className="text-gray-600">
            회원가입 완료를 위해 이메일 인증을 해주세요
          </p>
        </div>

        {/* 이메일 인증 안내 */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                📧 이메일 인증이 필요합니다
              </h4>
              <div className="bg-white px-4 py-3 rounded border border-blue-200 mb-3">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Supabase Auth</strong>
                  <span className="text-gray-600"> &#60;</span>
                  <span className="font-mono text-xs">noreply@mail.app.supabase.io</span>
                  <span className="text-gray-600">&#62;</span>
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  위 주소로 다음 이메일에 인증 요청을 보냈습니다:
                </p>
                <div className="bg-blue-50 px-3 py-2 rounded border border-blue-300 font-mono text-sm text-blue-900">
                  {userEmail}
                </div>
              </div>
              <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                <li><strong>이메일함</strong>을 확인하세요 (스팸함도 확인!)</li>
                <li><strong>Supabase Auth</strong>에서 보낸 메일을 찾으세요</li>
                <li><strong>"이메일 인증하기"</strong> 또는 <strong>"Confirm your mail"</strong> 버튼을 클릭하세요</li>
                <li>인증 완료 후 이 페이지로 돌아와 로그인하세요</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800">
              <strong>주의:</strong> 이메일 인증을 완료하지 않으면 로그인할 수 없습니다.
            </div>
          </div>
        </div>

        {/* 로그인 페이지로 버튼 */}
        <button
          onClick={() => router.push('/login')}
          className="w-full py-3 px-4 bg-cobalt-500 hover:bg-cobalt-600 text-white font-medium rounded-lg transition-all shadow-cobalt-md hover:shadow-cobalt-lg active:scale-95"
        >
          인증 완료 후 로그인하기 →
        </button>

        {/* 이메일 재발송 */}
        <div className="text-center">
          <button
            onClick={async () => {
              const supabase = createClient()
              const { error } = await supabase.auth.resend({
                type: 'signup',
                email: userEmail,
              })
              if (error) {
                alert('재발송 실패: ' + error.message)
              } else {
                alert('✅ 인증 메일을 다시 보냈습니다!')
              }
            }}
            className="text-sm text-gray-600 hover:text-cobalt-600 underline"
          >
            이메일을 받지 못하셨나요? 다시 보내기
          </button>
        </div>
      </div>
    )
  }

  // 회원가입 폼
  return (
    <>
      {/* ⭐⭐⭐ 에러 메시지 - 완전히 독립적으로 최상단에 표시 ⭐⭐⭐ */}
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

      {/* ⭐ 폼 컨테이너 - 로딩 오버레이는 여기만 덮음 */}
      <div className="relative">
        {/* 로딩 오버레이 - 폼만 덮음 (에러 메시지는 위에 있어서 안 가려짐!) */}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="example@email.com"
              disabled={loading}
              autoComplete="email"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="new-password"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* 회원가입 버튼 */}
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

          {/* 안내 */}
          <p className="text-xs text-gray-500 text-center">
            회원가입 시 <span className="font-medium">강사(Instructor)</span> 계정이 생성됩니다.
          </p>
        </form>
      </div>
    </>
  )
}
