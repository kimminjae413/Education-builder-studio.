// src/components/admin/AdminLayoutClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { User } from '@supabase/supabase-js'

interface AdminLayoutClientProps {
  user: User
  children: React.ReactNode
}

export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 헤더 */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {/* 🔴 햄버거 버튼 (모바일) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="메뉴 열기"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* 로고 */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold">관리자 모드</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.email}
            </span>
            <Link 
              href="/dashboard" 
              className="text-sm text-cobalt-600 hover:underline whitespace-nowrap"
            >
              강사 모드로 전환
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          {/* 🔴 관리자 사이드바 */}
          <AdminSidebar 
            isMobileOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* 메인 콘텐츠 */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
