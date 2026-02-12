// src/app/(admin)/admin/announcements/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile } from '@/lib/db/queries'
import { getAllAnnouncements } from '@/lib/db/announcements'
import { AnnouncementAdminList } from '@/components/admin/AnnouncementAdminList'

export default async function AdminAnnouncementsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }
  const user = await verifyIdToken(token)

  const profile = await getProfile(user.uid)
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { announcements } = await getAllAnnouncements()

  // Date → string 변환
  const serialized = announcements.map(a => ({
    ...a,
    created_at: typeof a.created_at === 'string' ? a.created_at : new Date(a.created_at).toISOString(),
    updated_at: typeof a.updated_at === 'string' ? a.updated_at : new Date(a.updated_at).toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
        <p className="text-gray-600 mt-1">공지사항을 작성하고 관리합니다</p>
      </div>

      <AnnouncementAdminList initialAnnouncements={serialized} />
    </div>
  )
}
