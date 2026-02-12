// src/app/(admin)/admin/inquiries/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile } from '@/lib/db/queries'
import { getAllInquiries } from '@/lib/db/inquiries'
import { InquiryAdminList } from '@/components/admin/InquiryAdminList'

export default async function AdminInquiriesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }
  const user = await verifyIdToken(token)

  const profile = await getProfile(user.uid)
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { inquiries } = await getAllInquiries()

  const serialized = inquiries.map(i => ({
    ...i,
    created_at: typeof i.created_at === 'string' ? i.created_at : new Date(i.created_at).toISOString(),
    updated_at: typeof i.updated_at === 'string' ? i.updated_at : new Date(i.updated_at).toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">1:1 문의 관리</h1>
        <p className="text-gray-600 mt-1">사용자 문의를 확인하고 답변합니다</p>
      </div>

      <InquiryAdminList initialInquiries={serialized} />
    </div>
  )
}
