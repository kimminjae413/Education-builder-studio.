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

  // 🟢 수정: 모든 사용자 조회 (role 필터 제거)
  const { data: allUsers } = await supabase
    .from('profiles')
    .select(`
      *,
      teaching_materials (
        id,
        status
      )
    `)
    .order('created_at', { ascending: false })

  // 🟢 강사와 미설정 사용자 모두 포함
  const displayUsers = allUsers || []

  // 🟢 강사만 필터링 (통계용)
  const instructors = allUsers?.filter(u => u.role === 'instructor') || []

  // 🟢 role 미설정 사용자 카운트
  const pendingUsers = allUsers?.filter(u => !u.role || u.role === null) || []

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
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">전체 사용자</div>
          <div className="text-3xl font-bold text-gray-900">
            {displayUsers.length}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            모든 계정
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">강사 계정</div>
          <div className="text-3xl font-bold text-gray-900">
            {instructors.length}
          </div>
          <div className="text-xs text-green-600 mt-1">
            ↗ 활성 강사
          </div>
        </div>

        {/* 🟢 신규: role 미설정 사용자 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">대기 중</div>
          <div className="text-3xl font-bold text-amber-600">
            {pendingUsers.length}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            ⚠️ Role 미설정
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">이번 달 가입</div>
          <div className="text-3xl font-bold text-gray-900">
            {displayUsers.filter(u => {
              const created = new Date(u.created_at)
              const now = new Date()
              return created.getMonth() === now.getMonth() &&
                     created.getFullYear() === now.getFullYear()
            }).length}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            신규 가입
          </div>
        </div>
      </div>

      {/* 🟢 경고: role 미설정 사용자가 있을 때 */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-amber-900">
                Role이 설정되지 않은 사용자가 {pendingUsers.length}명 있습니다
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                아래 목록에서 해당 사용자들을 확인하고 role을 설정해주세요.
              </p>
              <div className="mt-2 space-y-1">
                {pendingUsers.map(u => (
                  <div key={u.id} className="text-sm text-amber-800">
                    • {u.name || '이름 없음'} ({u.email})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 랭크 분포 (강사만) */}
      <RankDistribution counts={rankCounts} />

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          전체 사용자 목록
        </h2>
        {/* 🟢 수정: 모든 사용자 표시 */}
        <UsersTable users={displayUsers} />
      </div>
    </div>
  )
}
