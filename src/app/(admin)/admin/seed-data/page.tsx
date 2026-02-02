// src/app/(admin)/admin/seed-data/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile, getAllMaterialsWithUploader } from '@/lib/db/queries'
import { SeedDataUpload } from '@/components/admin/SeedDataUpload'
import { SeedDataTable } from '@/components/admin/SeedDataTable'

export default async function SeedDataPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }
  const user = await verifyIdToken(token)

  // 관리자 권한 확인
  const profile = await getProfile(user.uid)

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 모든 교육 자료 가져오기
  const materialsRaw = await getAllMaterialsWithUploader()

  // 형식 맞추기 (기존 컴포넌트와 호환 - Date를 string으로)
  const materials = materialsRaw.map(m => ({
    ...m,
    created_at: m.created_at?.toISOString?.() || String(m.created_at),
    seed_approved_at: m.seed_approved_at?.toISOString?.() || null,
    profiles: {
      name: m.uploader_name || '',
      email: m.uploader_email || '',
      rank: m.uploader_rank || 'newcomer',
    },
    seed_approver: m.reviewer_name ? {
      name: m.reviewer_name,
      email: m.reviewer_email || '',
    } : null,
  }))

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시드 데이터 관리</h1>
        <p className="text-gray-600 mt-1">
          새 자료를 업로드하거나 기존 자료를 시드로 지정할 수 있습니다
        </p>
      </div>

      {/* 파일 업로드 섹션 */}
      <SeedDataUpload />

      {/* 기존 자료 관리 */}
      {materials && materials.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📚 기존 자료 관리
          </h2>
          <p className="text-gray-600 mb-4">
            업로드된 자료 중 AI 설계에 참고할 시드 데이터를 지정하거나 해제할 수 있습니다
          </p>
          <SeedDataTable materials={materials} />
        </div>
      )}
    </div>
  )
}
