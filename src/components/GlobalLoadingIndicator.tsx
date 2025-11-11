'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function GlobalLoadingIndicator() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // 모든 링크와 버튼에 클릭 이벤트 추가
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      const button = target.closest('button')

      // 링크 클릭 (외부 링크 제외)
      if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
        const url = new URL(link.href)
        // 같은 도메인 내 링크만
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          setLoading(true)
        }
      }

      // ⭐ 중요: 폼 제출 버튼은 제외!
      // 각 폼(SignupForm, LoginForm 등)에서 자체 로딩 상태를 처리하므로
      // GlobalLoadingIndicator는 네비게이션 버튼만 처리
      // 
      // 네비게이션 버튼에 data-navigation="true" 속성 추가 필요:
      // <button data-navigation="true">대시보드로 이동</button>
      if (button && button.dataset.navigation === 'true') {
        setLoading(true)
        // 5초 후 자동으로 로딩 해제 (안전장치)
        setTimeout(() => setLoading(false), 5000)
      }
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [pathname])

  // 페이지 전환 완료 시 로딩 해제
  useEffect(() => {
    setLoading(false)
  }, [pathname])

  if (!loading) return null

  return (
    <>
      {/* 상단 프로그레스 바 */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-cobalt-100">
        <div className="h-full bg-cobalt-500 animate-loading-bar" />
      </div>

      {/* 전체 화면 오버레이 */}
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
