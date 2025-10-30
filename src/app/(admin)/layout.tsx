import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'  // ← 추가!
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 헤더 */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold">관리자 모드</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Link 
              href="/dashboard" 
              className="text-sm text-cobalt-600 hover:underline"
            >
              강사 모드로 전환
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          {/* 관리자 사이드바 - AdminSidebar 컴포넌트 사용 */}
          <AdminSidebar />

          {/* 메인 콘텐츠 */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
