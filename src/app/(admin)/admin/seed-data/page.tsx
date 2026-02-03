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

  // 시드 데이터 통계
  const seedCount = materials?.filter(m => m.is_seed_data).length || 0
  const approvedCount = materials?.filter(m => m.status === 'approved').length || 0

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시드 데이터 관리</h1>
        <p className="text-gray-600 mt-1">
          AI 교육과정 생성에 활용될 시드 데이터를 관리합니다
        </p>
      </div>

      {/* 안내 박스 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <span>🌱</span> 시드 데이터란?
        </h3>
        <div className="space-y-3 text-sm text-amber-800">
          <p>
            <strong>시드 데이터</strong>는 AI가 교육과정을 생성할 때 참고하는
            <strong> 검증된 교육 자료</strong>입니다. RAG(검색 증강 생성) 시스템에서 활용됩니다.
          </p>
          <div className="bg-white/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">1.</span>
              <span><strong>시드로 지정</strong> → AI가 교육과정 생성 시 이 자료를 참고</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">2.</span>
              <span><strong>인용되면 리워드</strong> → 자료가 활용될수록 기여자에게 포인트 적립</span>
            </div>
          </div>
          <div className="border-t border-amber-200 pt-3 mt-3 flex items-center justify-between">
            <p className="text-amber-700">
              <strong>💡 참고:</strong> 시드 데이터 지정과
              <a href="/admin/contents" className="underline font-medium ml-1">콘텐츠 승인</a>은
              별개입니다. 승인은 라이브러리 공개, 시드 지정은 AI 활용입니다.
            </p>
            <div className="text-right">
              <span className="text-xs text-amber-600">현재 시드 데이터</span>
              <p className="text-xl font-bold text-amber-900">{seedCount}개</p>
            </div>
          </div>
        </div>
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
            승인된 자료 중 AI 설계에 참고할 시드 데이터를 지정하거나 해제할 수 있습니다.
            (승인된 자료: {approvedCount}개 / 시드 지정: {seedCount}개)
          </p>
          <SeedDataTable materials={materials} />
        </div>
      )}
    </div>
  )
}
