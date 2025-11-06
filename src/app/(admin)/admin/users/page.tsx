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

  // ✅ 모든 사용자 조회 (FK 명시: user_id)
  const { data: allUsers, error: usersError } = await supabase
    .from('profiles')
    .select(`
      *,
      teaching_materials:teaching_materials!user_id (
        id,
        status
      )
    `)
    .order('created_at', { ascending: false })

  // 에러 로깅
  if (usersError) {
    console.error('❌ Users Query Error:', usersError)
  }

  // ✅ 강사만 필터링 (통계용)
  const instructors = allUsers?.filter(u => u.role === 'instructor') || []

  // 랭크별 통계 (강사만)
  const rankCounts = {
    newcomer: instructors.filter(u => u.rank === 'newcomer').length,
    junior: instructors.filter(u => u.rank === 'junior').length,
    intermediate: instructors.filter(u => u.rank === 'intermediate').length,
    senior: instructors.filter(u => u.rank === 'senior').length,
    veteran: instructors.filter(u => u.rank === 'veteran').length,
    master: instructors.filter(u => u.rank === 'master').length,
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-gray-600 mt-1">
          전체 사용자 목록을 확인하고 랭크를 조정할 수 있습니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">전체 사용자</div>
          <div className="text-3xl font-bold text-gray-900">
            {allUsers?.length || 0}
          </div>
          <div className="text-xs text-green-600 mt-1">
            ↗ 모든 계정
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">강사 계정</div>
          <div className="text-3xl font-bold text-gray-900">
            {instructors.length}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            활성 강사
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">이번 달 가입</div>
          <div className="text-3xl font-bold text-gray-900">
            {allUsers?.filter(u => {
              const created = new Date(u.created_at)
              const now = new Date()
              return created.getMonth() === now.getMonth() &&
                     created.getFullYear() === now.getFullYear()
            }).length || 0}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            신규 가입
          </div>
        </div>
      </div>

      {/* 랭크 분포 */}
      <RankDistribution counts={rankCounts} />

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          전체 사용자 목록
        </h2>
        <UsersTable users={allUsers || []} />
      </div>
    </div>
  )
}
