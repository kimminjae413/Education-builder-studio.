// src/app/(dashboard)/contribute/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile, getMaterialsByUser } from '@/lib/db/queries'
import { UploadForm } from '@/components/contribute/UploadForm'
import { MyMaterials } from '@/components/contribute/MyMaterials'

export default async function ContributePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }
  const user = await verifyIdToken(token)

  const profile = await getProfile(user.uid)

  // 사용자의 업로드된 콘텐츠 조회
  const materialsRaw = await getMaterialsByUser(user.uid)
  const materials = materialsRaw.map(m => ({
    ...m,
    created_at: m.created_at?.toISOString?.() || String(m.created_at),
    updated_at: m.updated_at?.toISOString?.() || String(m.updated_at),
  }))

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 기여</h1>
        <p className="text-gray-600">
          교육 자료를 공유하고 리워드를 받으세요
        </p>
      </div>

      {/* 업로드 제한 안내 */}
      {profile && (
        <div className="bg-cobalt-50 border border-cobalt-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📦</div>
            <div className="flex-1">
              <h3 className="font-semibold text-cobalt-900 mb-1">
                업로드 현황
              </h3>
              <p className="text-sm text-cobalt-700">
                {materials?.length || 0}개 업로드됨
                {profile.rank === 'newcomer' && ' · 최대 5개까지 업로드 가능'}
                {profile.rank === 'junior' && ' · 최대 20개까지 업로드 가능'}
                {profile.rank === 'intermediate' && ' · 최대 50개까지 업로드 가능'}
                {(profile.rank === 'senior' || profile.rank === 'veteran' || profile.rank === 'master') && ' · 무제한 업로드 가능'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 폼 */}
      <UploadForm profile={profile} />

      {/* 내가 올린 콘텐츠 */}
      <MyMaterials materials={materials || []} />
    </div>
  )
}
