'use client'

import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let redirected = false

    try {
      const auth = getFirebaseAuth()
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && !redirected) {
          // Firebase에 로그인되어 있으면 토큰 갱신 후 대시보드로
          redirected = true
          user.getIdToken(true)
            .then((token) => {
              document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`
              // router.push 대신 window.location 사용 (더 확실한 네비게이션)
              window.location.href = '/dashboard'
            })
            .catch((error) => {
              console.error('Token refresh failed:', error)
              redirected = false
              setIsChecking(false)
            })
        } else if (!user) {
          // user가 null이면 회원가입 폼 표시
          setIsChecking(false)
        }
      })
    } catch (error) {
      console.error('Firebase auth error:', error)
      setIsChecking(false)
    }

    return () => {
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

  // 회원가입 폼 표시

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

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-2xl shadow-cobalt-lg p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
            <p className="text-gray-600 mt-1">강사 계정을 만들어보세요</p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-cobalt-600 hover:underline font-medium">
                로그인
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
