// src/components/admin/AdminSidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Upload,
  DollarSign,
  Settings,
  Megaphone,
  HelpCircle,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getFirebaseAuth } from '@/lib/firebase/client'

interface AdminSidebarProps {
  isMobileOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isMobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [pendingInquiryCount, setPendingInquiryCount] = useState(0)

  // 대기중 문의 수 폴링 (60초 간격)
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const auth = getFirebaseAuth()
        const token = await auth.currentUser?.getIdToken()
        if (!token) return

        const res = await fetch('/api/admin/inquiries/pending-count', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setPendingInquiryCount(data.count)
        }
      } catch {
        // 무시
      }
    }

    fetchPendingCount()
    const interval = setInterval(fetchPendingCount, 60000)
    return () => clearInterval(interval)
  }, [])

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
      href: '/admin/announcements',
      label: '공지사항',
      icon: Megaphone,
    },
    {
      href: '/admin/inquiries',
      label: '1:1 문의',
      icon: HelpCircle,
      badge: pendingInquiryCount > 0 ? String(pendingInquiryCount) : undefined,
      badgeType: 'inquiry' as const,
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
      {/* 모바일 오버레이 배경 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-label="사이드바 닫기"
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          "bg-white border-r h-[calc(100vh-4rem)] overflow-y-auto",
          "lg:block lg:sticky lg:top-16 lg:w-64",
          "fixed top-16 left-0 bottom-0 w-64 z-50 transition-transform duration-300 lg:translate-x-0 lg:relative lg:top-auto lg:left-auto lg:bottom-auto lg:z-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 모바일 닫기 버튼 */}
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
            const isInquiry = item.badgeType === 'inquiry'

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-red-50 text-red-700 font-medium'
                    : isInquiry && pendingInquiryCount > 0
                      ? 'bg-red-50/50 text-red-600 hover:bg-red-100'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    'h-5 w-5',
                    isInquiry && pendingInquiryCount > 0 && !isActive && 'text-red-500'
                  )} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    'px-2 py-0.5 text-xs font-semibold rounded min-w-[1.5rem] text-center',
                    isInquiry
                      ? 'bg-red-500 text-white'
                      : 'bg-green-100 text-green-700'
                  )}>
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
