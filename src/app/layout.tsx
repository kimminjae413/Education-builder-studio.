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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-4 lg:py-8">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <Sidebar profile={profile} />
          </aside>

          <main className="pb-20 lg:pb-0">{children}</main>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
