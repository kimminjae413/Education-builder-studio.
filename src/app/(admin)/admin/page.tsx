import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 전체 통계 가져오기
  const { data: stats } = await supabase
    .from('admin_stats')
    .select('*')
    .single()

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'instructor')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600">전체 플랫폼 현황을 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">전체 강사</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.total_instructors || 0}
          </div>
          <div className="text-xs text-green-600 mt-1">↗ 활성 사용자</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">전체 콘텐츠</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.total_materials || 0}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            승인 대기: {stats?.pending_materials || 0}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">총 사용 횟수</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.total_usage || 0}
          </div>
          <div className="text-xs text-purple-600 mt-1">↗ 활발한 활동</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">총 다운로드</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.total_downloads || 0}
          </div>
          <div className="text-xs text-gold-600 mt-1">↗ 인기 콘텐츠</div>
        </div>
      </div>

      {/* 랭크별 분포 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">랭크별 분포</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">🌱</div>
            <div className="text-lg font-bold">{stats?.newcomer_count || 0}</div>
            <div className="text-xs text-gray-600">새싹</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">📘</div>
            <div className="text-lg font-bold">{stats?.junior_count || 0}</div>
            <div className="text-xs text-gray-600">초급</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">📗</div>
            <div className="text-lg font-bold">{stats?.intermediate_count || 0}</div>
            <div className="text-xs text-gray-600">중급</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">📕</div>
            <div className="text-lg font-bold">{stats?.senior_count || 0}</div>
            <div className="text-xs text-gray-600">고급</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-lg font-bold">{stats?.veteran_count || 0}</div>
            <div className="text-xs text-gray-600">베테랑</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">💎</div>
            <div className="text-lg font-bold">{stats?.master_count || 0}</div>
            <div className="text-xs text-gray-600">마스터</div>
          </div>
        </div>
      </div>

      {/* 최근 가입 사용자 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 가입 사용자</h2>
        <div className="space-y-3">
          {recentUsers?.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <div className="font-medium text-gray-900">
                  {user.name || '이름 없음'}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString('ko-KR')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
