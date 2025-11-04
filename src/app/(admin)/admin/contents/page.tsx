// src/app/(admin)/admin/contents/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContentsTable } from '@/components/admin/ContentsTable'
import { ContentStats } from '@/components/admin/ContentStats'

export default async function ContentsPage() {
  const supabase = await createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 모든 콘텐츠 가져오기 (업로더 정보 포함)
  const { data: materials } = await supabase
    .from('teaching_materials')
    .select(`
      *,
      uploader:user_id (
        id,
        name,
        email,
        rank
      ),
      reviewer:reviewed_by (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

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
