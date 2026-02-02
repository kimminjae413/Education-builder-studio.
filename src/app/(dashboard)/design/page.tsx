// src/app/(dashboard)/design/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile, getCoursesByUser } from '@/lib/db/queries'
import { AIDesignWizard } from '@/components/design/AIDesignWizard'
import { MyCourses } from '@/components/design/MyCourses'

export default async function DesignPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }
  const user = await verifyIdToken(token)

  const profile = await getProfile(user.uid)

  // 내가 만든 과정 조회
  const coursesRaw = await getCoursesByUser(user.uid, 10)
  const courses = coursesRaw.map(c => ({
    ...c,
    created_at: c.created_at?.toISOString?.() || String(c.created_at),
    updated_at: c.updated_at?.toISOString?.() || String(c.updated_at),
  }))

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI 설계 마법사</h1>
        <p className="text-gray-600">
          AI가 교육과정을 자동으로 설계해드립니다
        </p>
      </div>

      {/* AI 사용량 안내 */}
      {profile && (
        <div className="bg-cobalt-50 border border-cobalt-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🤖</div>
            <div className="flex-1">
              <h3 className="font-semibold text-cobalt-900 mb-1">
                AI 사용 현황
              </h3>
              <p className="text-sm text-cobalt-700">
                이번 달 {profile.ai_usage_count_this_month || 0}회 사용
                {profile.rank === 'newcomer' && ' · 최대 10회까지 가능'}
                {profile.rank === 'junior' && ' · 최대 30회까지 가능'}
                {profile.rank === 'intermediate' && ' · 최대 100회까지 가능'}
                {(profile.rank === 'senior' || profile.rank === 'veteran' || profile.rank === 'master') && ' · 무제한 사용 가능'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI 설계 마법사 */}
      <AIDesignWizard profile={profile} />

      {/* 내가 만든 과정 */}
      {courses && courses.length > 0 && (
        <MyCourses courses={courses} />
      )}
    </div>
  )
}
