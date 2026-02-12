// src/app/(dashboard)/announcements/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getPublishedAnnouncements, markAnnouncementsRead } from '@/lib/db/announcements'
import Link from 'next/link'
import { Pin, Eye, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default async function AnnouncementsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }

  let uid: string
  try {
    const decoded = await verifyIdToken(token)
    uid = decoded.uid
  } catch {
    redirect('/login')
  }

  const { announcements, total } = await getPublishedAnnouncements(50, 0)

  // 공지사항 페이지 방문 → 읽음 처리 (뱃지 제거)
  markAnnouncementsRead(uid).catch(() => {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
        <p className="text-gray-600 mt-1">중요한 안내사항을 확인하세요</p>
      </div>

      <div className="space-y-3">
        {announcements.map((a) => (
          <Link
            key={a.id}
            href={`/announcements/${a.id}`}
            className={cn(
              'block bg-white border rounded-xl p-4 hover:border-cobalt-300 hover:shadow-sm transition-all',
              a.is_pinned && 'border-amber-300 bg-amber-50/30'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {a.is_pinned && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      <Pin className="w-3 h-3" />
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{a.author_name}</span>
                  <span>{new Date(a.created_at).toLocaleDateString('ko-KR')}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {a.view_count}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
            </div>
          </Link>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            아직 공지사항이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
