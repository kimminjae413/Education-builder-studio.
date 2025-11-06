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

  // ✅ 모든 사용자 조회 (role 필터 제거)
  const { data: allUsers, error: usersError } = await supabase
    .from('profiles')
    .select(`
      *,
      teaching_materials (
        id,
        status
      )
    `)
    .order('created_at', { ascending: false })

  // 에러 로깅
  if (usersError) {
    console.error('❌ Users Query Error:', usersError)
  }

  // 서버 로그에도 출력
  console.log('✅ UsersPage - allUsers:', allUsers?.length, '명')
  console.log('✅ UsersPage - emails:', allUsers?.map(u => u.email).join(', '))

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
      {/* 🔍 디버그 정보 - 인라인 스타일 사용! */}
      <div style={{
        backgroundColor: '#fef3c7',
        borderLeft: '8px solid #f59e0b',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#78350f',
          marginBottom: '16px'
        }}>
          🔍 디버그 정보 (인라인 스타일로 무조건 보임!)
        </h3>
        <div style={{ fontSize: '16px', color: '#92400e', lineHeight: '1.8' }}>
          <div style={{ marginBottom: '8px' }}><strong>현재 사용자:</strong> {user.email}</div>
          <div style={{ marginBottom: '8px' }}><strong>관리자 여부:</strong> {profile?.role === 'admin' ? '✅ Yes' : '❌ No'}</div>
          <div style={{ marginBottom: '8px' }}><strong>조회 에러:</strong> {usersError ? usersError.message : '✅ 없음'}</div>
          <div style={{ marginBottom: '8px' }}><strong>allUsers:</strong> {allUsers?.length || 0}명</div>
          <div style={{ marginBottom: '8px' }}><strong>instructors:</strong> {instructors.length}명</div>
          <div style={{ marginBottom: '8px' }}><strong>admin:</strong> {allUsers?.filter(u => u.role === 'admin').length || 0}명</div>
          {allUsers && allUsers.length > 0 && (
            <div style={{ 
              fontSize: '14px', 
              color: '#a16207', 
              marginTop: '16px', 
              fontFamily: 'monospace',
              backgroundColor: '#fef9c3',
              padding: '12px',
              borderRadius: '6px'
            }}>
              <strong>이메일 목록:</strong><br/>
              {allUsers.map(u => u.email).join(', ')}
            </div>
          )}
          {(!allUsers || allUsers.length === 0) && (
            <div style={{ 
              color: '#dc2626', 
              fontWeight: 'bold', 
              marginTop: '16px', 
              fontSize: '18px',
              backgroundColor: '#fee2e2',
              padding: '12px',
              borderRadius: '6px'
            }}>
              ⚠️ 데이터를 가져오지 못했습니다!
            </div>
          )}
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
        <UsersTable users={allUsers || []} />
      </div>
    </div>
  )
}
