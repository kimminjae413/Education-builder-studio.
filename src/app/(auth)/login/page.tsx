'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { useEffect } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'

// 쿠키 삭제 함수
function clearAuthCookie() {
  document.cookie = 'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // 페이지 로드 시 쿠키 정리 (리디렉션 루프 방지)
    clearAuthCookie()

    let unsubscribe: (() => void) | undefined

    try {
      const auth = getFirebaseAuth()
      // 동기 콜백 사용 - async 콜백은 문제를 일으킬 수 있음
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // Firebase에 로그인되어 있으면 토큰 갱신 후 대시보드로
          user.getIdToken(true)
            .then((token) => {
              document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`
              router.push('/dashboard')
            })
            .catch((error) => {
              console.error('Token refresh failed:', error)
              clearAuthCookie()
            })
        }
        // user가 null이면 로그인 폼 표시 (이미 표시 중)
      })
    } catch (error) {
      console.error('Firebase auth error:', error)
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [router])

  // 로그인 폼 즉시 표시 (로딩 상태 제거)

  return (
    <div className="min-h-screen bg-gradient-to-b from-cobalt-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-12 w-12 rounded-lg bg-cobalt-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">EBS</span>
            </div>
            <div className="text-left">
              <h1 className="font-bold text-gray-900">Education Builder Studio</h1>
              <p className="text-xs text-gray-600">지혜를 설계하고, 경험을 공유하며</p>
            </div>
          </Link>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl shadow-cobalt-lg p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
            <p className="text-gray-600 mt-1">계정에 로그인하세요</p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요?{' '}
              <Link href="/signup" className="text-cobalt-600 hover:underline font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <p className="text-center text-xs text-gray-500">
          © 2025 에듀이노랩. All rights reserved.
        </p>
      </div>
    </div>
  )
}
