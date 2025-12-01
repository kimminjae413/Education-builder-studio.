'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 이미 로그인됨 → 대시보드로
        router.push('/dashboard')
      } else {
        // 로그인 안됨 → 폼 표시
        setChecking(false)
      }
    }

    checkAuth()
  }, [router])

  // 로딩 중
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cobalt-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-cobalt-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">로딩 중...</p>
        </div>
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
