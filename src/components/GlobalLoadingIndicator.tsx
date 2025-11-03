'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function GlobalLoadingIndicator() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 페이지 전환 시작
    setLoading(true)
    
    // 페이지 전환 완료 (약간의 딜레이 후)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  if (!loading) return null

  return (
    <>
      {/* 상단 프로그레스 바 */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-cobalt-100">
        <div className="h-full bg-cobalt-500 animate-loading-bar" />
      </div>

      {/* 전체 화면 오버레이 (선택적) */}
      <div className="fixed inset-0 z-[9998] bg-white/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
          <svg 
            className="animate-spin h-6 w-6 text-cobalt-500" 
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
          <span className="text-gray-700 font-medium">로딩 중...</span>
        </div>
      </div>
    </>
  )
}
