// src/app/(admin)/admin/contents/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile, getAllMaterialsWithUploader } from '@/lib/db/queries'
import { ContentsTable } from '@/components/admin/ContentsTable'
import { ContentStats } from '@/components/admin/ContentStats'

export default async function ContentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }
  const user = await verifyIdToken(token)

  // 관리자 권한 확인
  const profile = await getProfile(user.uid)

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 모든 콘텐츠 가져오기 (업로더 정보 포함)
  const materialsRaw = await getAllMaterialsWithUploader()

  // 형식 맞추기 (기존 컴포넌트와 호환)
  const materials = materialsRaw.map(m => ({
    ...m,
    uploader: {
      id: m.user_id,
      name: m.uploader_name,
      email: m.uploader_email,
      rank: m.uploader_rank,
    },
    reviewer: m.reviewer_name ? {
      name: m.reviewer_name,
      email: m.reviewer_email,
    } : null,
  }))

  // 상태별 통계
  const stats = {
    total: materials?.length || 0,
    pending: materials?.filter(m => m.status === 'pending').length || 0,
    approved: materials?.filter(m => m.status === 'approved').length || 0,
    rejected: materials?.filter(m => m.status === 'rejected').length || 0,
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 승인</h1>
        <p className="text-gray-600 mt-1">
          업로드된 콘텐츠를 검토하고 승인/거부할 수 있습니다
        </p>
      </div>

      {/* 안내 박스 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <span>ℹ️</span> 콘텐츠 승인이란?
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>승인된 콘텐츠</strong>는 <strong>콘텐츠 라이브러리</strong>에 공개되어
            모든 사용자가 검색하고 다운로드할 수 있습니다.
          </p>
          <div className="bg-white/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>승인</strong> → 라이브러리에 공개 (모든 유저 열람 가능)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600">✗</span>
              <span><strong>거부</strong> → 비공개 처리 (업로더만 확인 가능)</span>
            </div>
          </div>
          <div className="border-t border-blue-200 pt-3 mt-3">
            <p className="text-blue-700">
              <strong>💡 참고:</strong> 승인된 콘텐츠를 AI 교육과정 생성에 활용하려면,
              별도로 <a href="/admin/seed-data" className="underline font-medium">시드 데이터 관리</a>에서
              해당 자료를 시드로 지정해야 합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <ContentStats stats={stats} />

      {/* 콘텐츠 테이블 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          전체 콘텐츠 목록
        </h2>
        <ContentsTable materials={materials || []} />
      </div>
    </div>
  )
}
