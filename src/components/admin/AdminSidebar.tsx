// src/components/admin/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Upload,
  DollarSign,
  Settings
} from 'lucide-react'

export function AdminSidebar() {
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
    <aside className="w-64 bg-white border-r h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
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
  )
}
