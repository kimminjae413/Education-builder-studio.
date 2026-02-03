'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let redirected = false
    let authResolved = false

    // 3초 타임아웃 - Firebase 응답이 없으면 로그인 폼 표시
    const timeout = setTimeout(() => {
      if (!authResolved) {
        console.log('Auth check timeout - showing login form')
        setIsChecking(false)
      }
    }, 3000)

    try {
      const auth = getFirebaseAuth()
      unsubscribe = onAuthStateChanged(auth, (user) => {
        authResolved = true
        clearTimeout(timeout)

        if (user && !redirected) {
          // Firebase에 로그인되어 있으면 토큰 갱신 후 대시보드로
          redirected = true
          user.getIdToken(true)
            .then((token) => {
              document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`
              window.location.href = '/dashboard'
            })
            .catch((error) => {
              console.error('Token refresh failed:', error)
              redirected = false
              setIsChecking(false)
            })
        } else if (!user) {
          // user가 null이면 로그인 폼 표시
          setIsChecking(false)
        }
      })
    } catch (error) {
      console.error('Firebase auth error:', error)
      clearTimeout(timeout)
      setIsChecking(false)
    }

    return () => {
      clearTimeout(timeout)
      if (unsubscribe) unsubscribe()
    }
  }, [router])

  // 인증 확인 중일 때 로딩 표시
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cobalt-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cobalt-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

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
