// src/components/dashboard/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { 
  Home, 
  Wand2, 
  Library, 
  Upload, 
  Trophy,
  Shield,
  User
} from 'lucide-react'

interface BottomNavProps {
  profile: any
}

export function BottomNav({ profile }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: '홈',
      icon: Home,
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
      label: '기여',
      icon: Upload,
    },
    {
      href: '/profile',
      label: '프로필',
      icon: User,
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          // ⭐ 관리자 메뉴는 빨간색으로 강조
          const isAdminMenu = item.href === '/admin'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 rounded-lg transition-colors',
                isActive && !isAdminMenu && 'text-cobalt-600',
                isActive && isAdminMenu && 'text-red-600',
                !isActive && !isAdminMenu && 'text-gray-600 hover:text-cobalt-600',
                !isActive && isAdminMenu && 'text-gray-600 hover:text-red-600'
              )}
            >
              <Icon className={cn(
                'h-5 w-5',
                isActive && !isAdminMenu && 'stroke-[2.5]',
                isActive && isAdminMenu && 'stroke-[2.5]'
              )} />
              <span className={cn(
                'text-[10px] font-medium',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
