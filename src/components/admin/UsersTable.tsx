// src/app/(admin)/admin/users/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/admin/UsersTable'
import { RankDistribution } from '@/components/admin/RankDistribution'

export default async function UsersPage() {
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

  // 모든 강사 조회
  const { data: instructors } = await supabase
    .from('profiles')
    .select(`
      *,
      teaching_materials (
        id,
        status
      )
    `)
    .eq('role', 'instructor')
    .order('created_at', { ascending: false })

  // 랭크별 통계
  const rankCounts = {
    newcomer: instructors?.filter(u => u.rank === 'newcomer').length || 0,
    junior: instructors?.filter(u => u.rank === 'junior').length || 0,
    intermediate: instructors?.filter(u => u.rank === 'intermediate').length || 0,
    senior: instructors?.filter(u => u.rank === 'senior').length || 0,
    veteran: instructors?.filter(u => u.rank === 'veteran').length || 0,
    master: instructors?.filter(u => u.rank === 'master').length || 0,
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-gray-600 mt-1">
          전체 강사 목록을 확인하고 랭크를 조정할 수 있습니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">전체 강사</div>
          <div className="text-3xl font-bold text-gray-900">
            {instructors?.length || 0}
          </div>
          <div className="text-xs text-green-600 mt-1">
            ↗ 활성 사용자
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">이번 달 가입</div>
          <div className="text-3xl font-bold text-gray-900">
            {instructors?.filter(u => {
              const created = new Date(u.created_at)
              const now = new Date()
              return created.getMonth() === now.getMonth() &&
                     created.getFullYear() === now.getFullYear()
            }).length || 0}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            신규 강사
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">평균 포인트</div>
          <div className="text-3xl font-bold text-gray-900">
            {instructors && instructors.length > 0
              ? Math.round(
                  instructors.reduce((sum, u) => sum + (u.rank_points || 0), 0) / 
                  instructors.length
                ).toLocaleString()
              : 0}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            총 {instructors?.reduce((sum, u) => sum + (u.rank_points || 0), 0).toLocaleString()}점
          </div>
        </div>
      </div>

      {/* 랭크 분포 */}
      <RankDistribution counts={rankCounts} />

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          전체 강사 목록
        </h2>
        <UsersTable users={instructors || []} />
      </div>
    </div>
  )
}
