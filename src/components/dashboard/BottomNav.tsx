'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { 
  LayoutDashboard, 
  Wand2, 
  Library, 
  Upload, 
  User
} from 'lucide-react'

interface BottomNavProps {
  profile: any
}

const navigation = [
  { name: '홈', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI 설계', href: '/dashboard/design', icon: Wand2 },
  { name: '라이브러리', href: '/dashboard/library', icon: Library },
  { name: '공유', href: '/dashboard/contribute', icon: Upload },
  { name: '내 정보', href: '/dashboard/profile', icon: User },
]

export function BottomNav({ profile }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all flex-1',
                isActive
                  ? 'text-cobalt-600'
                  : 'text-gray-600'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'text-cobalt-600')} />
              <span className={cn('text-xs font-medium', isActive && 'text-cobalt-700')}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
