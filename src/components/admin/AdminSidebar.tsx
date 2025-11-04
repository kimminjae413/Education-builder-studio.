// src/components/admin/AdminSidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Upload,
  DollarSign,
  Settings,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AdminSidebarProps {
  isMobileOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isMobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      href: '/admin',
      label: '대시보드',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/seed-data',
      label: '시드 데이터',
      icon: Upload,
      badge: 'NEW'
    },
    {
      href: '/admin/users',
      label: '사용자 관리',
      icon: Users,
    },
    {
      href: '/admin/contents',
      label: '콘텐츠 승인',
      icon: FileCheck,
    },
    {
      href: '/admin/rewards',
      label: '리워드 관리',
      icon: DollarSign,
    },
    {
      href: '/admin/settings',
      label: '설정',
      icon: Settings,
    },
  ]

  return (
    <>
      {/* 🔴 모바일 오버레이 배경 (클릭하면 닫힘) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-label="사이드바 닫기"
        />
      )}

      {/* 📱 사이드바 */}
      <aside 
        className={cn(
          // 공통 스타일
          "bg-white border-r h-[calc(100vh-4rem)] overflow-y-auto",
          // 데스크톱: 항상 표시
          "lg:block lg:sticky lg:top-16 lg:w-64",
          // 모바일: 슬라이드 애니메이션
          "fixed top-16 left-0 bottom-0 w-64 z-50 transition-transform duration-300 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 🔴 모바일 닫기 버튼 */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">관리자 메뉴</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="메뉴 닫기"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 메뉴 리스트 */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose} // 🔴 클릭하면 사이드바 닫기
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-red-50 text-red-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
