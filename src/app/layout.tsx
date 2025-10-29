import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
})

export const metadata: Metadata = {
  title: 'Education Builder Studio - 지혜를 설계하고, 경험을 공유하며',
  description: 'AI 기반 교육과정 개발 지원 및 공유 플랫폼',
  keywords: ['교육', '강사', '교육과정', 'AI', '코딩교육', '메이커교육'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
