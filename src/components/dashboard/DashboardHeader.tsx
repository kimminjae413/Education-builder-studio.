'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RankBadge } from '@/components/rank/RankBadge'
import { User } from '@supabase/supabase-js'
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react'

interface DashboardHeaderProps {
  user: User
  profile: any
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {/* 로고 */}
            <div className="flex items-center gap-2">
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
            </div>
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
                  onClick={() => router.push('/dashboard/profile')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="프로필"
                >
                  <UserIcon className="w-5 h-5 text-gray-600" />
                </button>

                {/* 로그아웃 버튼 */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 (드롭다운) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-gray-900">{profile?.name || '이름 없음'}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              {profile?.rank && <RankBadge rank={profile.rank} size="sm" />}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
