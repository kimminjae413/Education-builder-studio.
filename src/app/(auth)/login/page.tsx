'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'

// 쿠키 삭제 함수
function clearAuthCookie() {
  document.cookie = 'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

export default function LoginPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // 페이지 로드 시 먼저 쿠키 정리 (리디렉션 루프 방지)
    // Firebase Auth 상태와 쿠키 상태 동기화
    try {
      const auth = getFirebaseAuth()
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Firebase에 로그인되어 있으면 토큰 갱신 후 대시보드로
          try {
            const token = await user.getIdToken(true)
            document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`
            router.push('/dashboard')
          } catch (error) {
            console.error('Token refresh failed:', error)
            clearAuthCookie()
            setIsChecking(false)
          }
        } else {
          // Firebase에 로그인되어 있지 않으면 쿠키도 정리
          clearAuthCookie()
          setIsChecking(false)
        }
      })
      return () => unsubscribe()
    } catch (error) {
      console.error('Firebase auth error:', error)
      clearAuthCookie()
      setIsChecking(false)
    }
  }, [router])

  // 인증 상태 확인 중일 때 로딩 표시
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cobalt-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cobalt-600"></div>
      </div>
    )
  }

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
