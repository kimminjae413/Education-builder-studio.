import type { Metadata } from 'next'
import './globals.css'
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Education Builder Studio',
  description: '지혜를 설계하고, 경험을 공유하며, 교육의 미래를 함께 짓다',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        {/* ⭐ 전역 로딩 인디케이터 */}
        <Suspense fallback={null}>
          <GlobalLoadingIndicator />
        </Suspense>
        
        {children}
      </body>
    </html>
  )
}
