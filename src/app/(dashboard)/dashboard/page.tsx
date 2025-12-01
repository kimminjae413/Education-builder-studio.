import { createClient } from '@/lib/supabase/server'
import { RankBadge } from '@/components/rank/RankBadge'
import { RankProgress } from '@/components/rank/RankProgress'
import { InstructorRank } from '@/lib/rank/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: materials, count: materialsCount } = await supabase
    .from('teaching_materials')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)

  const approvedCount = materials?.filter(m => m.status === 'approved').length || 0

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {profile?.name || '강사'}님! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          오늘도 멋진 교육과정을 설계해보세요
        </p>
      </div>

      {/* 랭크 정보 */}
      <div className="bg-gradient-to-br from-cobalt-50 to-white rounded-2xl p-6 border border-cobalt-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">내 랭크</h2>
          <RankBadge rank={profile?.rank as InstructorRank} />
        </div>
        
        <RankProgress 
          currentRank={profile?.rank as InstructorRank}
          currentPoints={profile?.rank_points || 0}
        />

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cobalt-600">
              {profile?.rank_points || 0}
            </div>
            <div className="text-xs text-gray-600">총 포인트</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <div className="text-xs text-gray-600">승인된 콘텐츠</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {materialsCount || 0}
            </div>
            <div className="text-xs text-gray-600">전체 콘텐츠</div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="grid md:grid-cols-2 gap-4">
        <a
          href="/design"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-cobalt-300 hover:shadow-cobalt-md transition-all group"
        >
          <div className="h-12 w-12 rounded-lg bg-cobalt-100 flex items-center justify-center mb-4 group-hover:bg-cobalt-500 transition-colors">
            <span className="text-2xl group-hover:scale-110 transition-transform">🤖</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">AI 설계 마법사</h3>
          <p className="text-sm text-gray-600">새로운 교육과정 설계하기</p>
        </a>

        <a
          href="/library"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-cobalt-300 hover:shadow-cobalt-md transition-all group"
        >
          <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
            <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">콘텐츠 라이브러리</h3>
          <p className="text-sm text-gray-600">베테랑 자료 둘러보기</p>
        </a>

        <a
          href="/contribute"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-cobalt-300 hover:shadow-cobalt-md transition-all group"
        >
          <div className="h-12 w-12 rounded-lg bg-gold-100 flex items-center justify-center mb-4 group-hover:bg-gold-500 transition-colors">
            <span className="text-2xl group-hover:scale-110 transition-transform">⬆️</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">콘텐츠 기여</h3>
          <p className="text-sm text-gray-600">내 자료 공유하고 리워드 받기</p>
        </a>

        <a
          href="/rewards"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-cobalt-300 hover:shadow-cobalt-md transition-all group"
        >
          <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
            <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">리워드</h3>
          <p className="text-sm text-gray-600">내 기여도 확인하기</p>
        </a>
      </div>
    </div>
  )
}
