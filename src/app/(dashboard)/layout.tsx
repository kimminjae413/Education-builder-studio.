import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BottomNav } from '@/components/dashboard/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 - ✅ user와 profile 둘 다 전달해야 함! */}
      <DashboardHeader user={user} profile={profile} />

      <div className="container mx-auto px-4 py-4 lg:py-8">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          {/* 사이드바 (데스크톱) */}
          <aside className="hidden lg:block">
            <Sidebar profile={profile} />
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="pb-20 lg:pb-0">{children}</main>
        </div>
      </div>

      {/* 하단 네비게이션 (모바일) */}
      <BottomNav profile={profile} />
    </div>
  )
}
