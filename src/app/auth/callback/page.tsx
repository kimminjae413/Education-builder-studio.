'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        
        if (!code) {
          setStatus('error')
          setMessage('인증 코드가 없습니다.')
          return
        }

        const supabase = createClient()

        // 이메일 인증 처리
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error('🔴 Auth callback error:', error)
          setStatus('error')
          setMessage(`인증 실패: ${error.message}`)
          return
        }

        if (data.session) {
          console.log('✅ Email confirmed, session created')
          setStatus('success')
          setMessage('이메일 인증이 완료되었습니다!')
          
          // 2초 후 대시보드로 이동
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } catch (err: any) {
        console.error('🔴 Unexpected error:', err)
        setStatus('error')
        setMessage(`오류: ${err.message}`)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-b from-cobalt-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-cobalt-lg p-8 border border-gray-100 text-center">
          {status === 'loading' && (
            <>
              <svg 
                className="animate-spin h-16 w-16 text-cobalt-500 mx-auto mb-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                이메일 인증 중...
              </h2>
              <p className="text-gray-600">
                잠시만 기다려주세요
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  className="w-8 h-8 text-green-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                인증 완료! 🎉
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg 
                  className="animate-spin h-4 w-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>대시보드로 이동 중...</span>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  className="w-8 h-8 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                인증 실패
              </h2>
              <p className="text-red-600 mb-6 text-sm">
                {message}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 px-4 bg-cobalt-500 hover:bg-cobalt-600 text-white font-medium rounded-lg transition-all"
              >
                로그인 페이지로 이동
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
