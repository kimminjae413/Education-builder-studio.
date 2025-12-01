// src/components/dashboard/DashboardHeader.tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RankBadge } from '@/components/rank/RankBadge'
import { User } from '@supabase/supabase-js'
import { 
  Menu, 
  X, 
  LogOut, 
  User as UserIcon,
  LayoutDashboard,
  Wand2,
  Library,
  Upload,
  Trophy,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DashboardHeaderProps {
  user: User
  profile: any
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    {
      href: '/dashboard',
      label: '대시보드',
      icon: LayoutDashboard,
    },
    {
      href: '/design',
      label: 'AI 설계',
      icon: Wand2,
    },
    {
      href: '/library',
      label: '라이브러리',
      icon: Library,
    },
    {
      href: '/contribute',
      label: '콘텐츠 기여',
      icon: Upload,
    },
    {
      href: '/rewards',
      label: '리워드',
      icon: Trophy,
    },
  ]

  // ⭐ 관리자인 경우 관리자 메뉴 추가
  if (profile?.role === 'admin') {
    navItems.push({
      href: '/admin',
      label: '관리자',
      icon: Shield,
    })
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 & 사이드바 토글 */}
          <div className="flex items-center gap-3">
            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="메뉴 열기/닫기"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {/* 로고 */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-cobalt-500 flex items-center justify-center shadow-cobalt-md">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">EBS</h1>
                <p className="text-xs text-gray-500">Education Builder Studio</p>
              </div>
            </Link>
          </div>

          {/* 사용자 정보 */}
          <div className="flex items-center gap-3">
            {/* 랭크 뱃지 */}
            {profile?.rank && (
              <div className="hidden sm:block">
                <RankBadge rank={profile.rank} size="sm" />
              </div>
            )}

            {/* 사용자 메뉴 */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.name || '이름 없음'}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <div className="flex items-center gap-1">
                {/* 프로필 버튼 */}
                <button
                  onClick={() => router.push('/profile')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="프로필"
                  aria-label="프로필"
                >
                  <UserIcon className="w-5 h-5 text-gray-600" />
                </button>

                {/* 로그아웃 버튼 */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  title="로그아웃"
                  aria-label="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ 모바일 메뉴 드롭다운 (네비게이션 포함) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          {/* 사용자 정보 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{profile?.name || '이름 없음'}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              {profile?.rank && <RankBadge rank={profile.rank} size="sm" />}
            </div>
          </div>

          {/* ⭐ 네비게이션 메뉴 */}
          <nav className="p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const isAdminMenu = item.href === '/admin'

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1',
                    isActive && !isAdminMenu && 'bg-cobalt-500 text-white',
                    isActive && isAdminMenu && 'bg-red-500 text-white',
                    !isActive && !isAdminMenu && 'text-gray-700 hover:bg-gray-100',
                    !isActive && isAdminMenu && 'text-red-600 hover:bg-red-50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {isAdminMenu && !isActive && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      ADMIN
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
