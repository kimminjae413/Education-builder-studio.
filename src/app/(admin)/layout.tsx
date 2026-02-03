// src/app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile } from '@/lib/db/queries'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value

  if (!token) redirect('/login')

  let user
  try {
    const decodedToken = await verifyIdToken(token)
    user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    }
  } catch {
    redirect('/login')
  }

  // 관리자 권한 확인
  const profile = await getProfile(user.uid)

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <AdminLayoutClient user={user}>
      {children}
    </AdminLayoutClient>
  )
}
