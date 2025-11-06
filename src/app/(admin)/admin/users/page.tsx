// src/app/(admin)/admin/users/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/admin/UsersTable'
import { RankDistribution } from '@/components/admin/RankDistribution'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

  // ✅ Service Role 클라이언트 생성 (RLS 우회)
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // ✅ Service Role로 모든 사용자 조회 (RLS 무시)
  const { data: allUsers, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      teaching_materials (
        id,
        status
      )
    `)
    .order('created_at', { ascending: false })

  // 디버그: 에러 확인
  if (error) {
    console.error('❌ Supabase Error:', error)
  }

  console.log('✅ allUsers:', allUsers?.length, '명')

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
      {/* 🔍 디버그 정보 */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
        <h3 className="font-bold text-yellow-900 mb-2">🔍 디버그 정보</h3>
        <div className="text-sm space-y-1 text-yellow-800">
          <div><strong>조회 에러:</strong> {error ? error.message : '없음'}</div>
          <div><strong>allUsers:</strong> {allUsers?.length || 0}명</div>
          <div><strong>instructors:</strong> {instructors.length}명</div>
          <div><strong>admin:</strong> {allUsers?.filter(u => u.role === 'admin').length || 0}명</div>
          <div className="text-xs text-yellow-700 mt-2 font-mono">
            이메일: {allUsers?.map(u => u.email).join(', ') || '없음'}
          </div>
        </div>
      </div>

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
        {/* ✅ 수정: 모든 사용자 표시 */}
        <UsersTable users={allUsers || []} />
      </div>
    </div>
  )
}
