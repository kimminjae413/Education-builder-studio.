// src/app/(dashboard)/announcements/[id]/page.tsx
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getAnnouncementById } from '@/lib/db/announcements'
import Link from 'next/link'
import { ArrowLeft, Pin, Eye, Calendar } from 'lucide-react'

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }

  try {
    await verifyIdToken(token)
  } catch {
    redirect('/login')
  }

  const { id } = await params
  const announcement = await getAnnouncementById(id)

  if (!announcement || !announcement.is_published) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Link
        href="/announcements"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-cobalt-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        공지사항 목록
      </Link>

      {/* 본문 */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          {announcement.is_pinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              <Pin className="w-3 h-3" /> 고정
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{announcement.title}</h1>

        <div className="flex items-center gap-4 pb-4 border-b mb-6 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{announcement.author_name}</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {announcement.view_count}
          </span>
        </div>

        <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed">
          {announcement.content}
        </div>
      </div>
    </div>
  )
}
