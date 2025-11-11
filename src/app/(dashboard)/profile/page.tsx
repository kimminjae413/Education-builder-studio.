// src/app/(dashboard)/profile/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RankBadge } from '@/components/rank/RankBadge'
import { RankProgress } from '@/components/rank/RankProgress'
import { InstructorRank } from '@/lib/rank/types'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { ProfileStats } from '@/components/profile/ProfileStats'

// ✅ Dynamic rendering 명시
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 프로필 조회 (에러 처리)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 프로필이 없으면 기본값 사용
    const safeProfile = profile || {
      id: user.id,
      email: user.email,
      name: null,
      phone: null,
      bio: null,
      rank: 'newcomer',
      rank_points: 0,
      role: 'instructor',
      ai_usage_count_this_month: 0,
      created_at: new Date().toISOString(),
    }

    // 콘텐츠 통계 (에러 시 0)
    let materialCount = 0
    let totalDownloads = 0
    let avgRating = 0

    try {
      const { data: materials, count } = await supabase
        .from('teaching_materials')
        .select('download_count, rating, rating_count', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'approved')

      materialCount = count || 0
      totalDownloads = materials?.reduce((sum, m) => sum + (m.download_count || 0), 0) || 0
      
      const ratedMaterials = materials?.filter(m => m.rating_count > 0) || []
      avgRating = ratedMaterials.length > 0
        ? ratedMaterials.reduce((sum, m) => sum + m.rating, 0) / ratedMaterials.length
        : 0
    } catch (error) {
      console.error('Error fetching materials:', error)
      // 통계 조회 실패해도 계속 진행
    }

    return (
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
          <p className="text-gray-600">내 정보 및 활동 통계를 확인하세요</p>
        </div>

        {/* 메인 레이아웃 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 좌측: 프로필 정보 (2칸) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                {/* 아바타 */}
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cobalt-400 to-cobalt-600 flex items-center justify-center text-white flex-shrink-0">
                  <span className="text-3xl font-bold">
                    {safeProfile.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {safeProfile.name || '이름 없음'}
                  </h2>
                  <p className="text-gray-600 text-sm truncate">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <RankBadge rank={safeProfile.rank as InstructorRank} />
                    {safeProfile.role === 'admin' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                        관리자
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="space-y-2 pb-4 border-b">
                <label className="block text-sm font-medium text-gray-700">
                  자기소개
                </label>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {safeProfile.bio || '자기소개를 작성해주세요'}
                </p>
              </div>

              {/* 연락처 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pb-4 border-b">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <p className="text-gray-900 text-sm truncate">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    핸드폰 번호
                  </label>
                  <p className="text-gray-900 text-sm">
                    {safeProfile.phone || '등록된 번호가 없습니다'}
                  </p>
                </div>
              </div>

              {/* 가입 정보 */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가입일
                  </label>
                  <p className="text-gray-900 text-sm">
                    {new Date(safeProfile.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    랭크 포인트
                  </label>
                  <p className="text-gray-900 text-sm font-mono">
                    {safeProfile.rank_points?.toLocaleString() || 0}점
                  </p>
                </div>
              </div>
            </div>

            {/* 랭크 진행 상황 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">랭크 진행 상황</h3>
              <RankProgress
                currentRank={safeProfile.rank as InstructorRank}
                currentPoints={safeProfile.rank_points || 0}
              />
            </div>

            {/* 프로필 편집 폼 */}
            <ProfileEditForm 
              profile={{
                id: safeProfile.id,
                name: safeProfile.name,
                phone: safeProfile.phone,
                bio: safeProfile.bio,
              }} 
            />
          </div>

          {/* 우측: 통계 (1칸) */}
          <div className="lg:col-span-1">
            <ProfileStats
              profile={{
                rank: safeProfile.rank as InstructorRank,
              }}
              stats={{
                materialCount,
                totalDownloads,
                avgRating,
                aiUsageThisMonth: safeProfile.ai_usage_count_this_month || 0,
              }}
            />
          </div>
        </div>

        {/* 에러 안내 (프로필 없을 때만) */}
        {profileError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              ⚠️ 프로필 정보를 불러오는 중 문제가 발생했습니다. 기본 정보로 표시됩니다.
            </p>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Profile page error:', error)
    
    // 완전 실패 시 기본 UI
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
          <p className="text-gray-600">내 정보를 관리하세요</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            프로필을 불러올 수 없습니다
          </h3>
          <p className="text-red-700 text-sm mb-4">
            Supabase 데이터베이스가 설정되지 않았을 수 있습니다.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700"
          >
            대시보드로 돌아가기
          </a>
        </div>
      </div>
    )
  }
}
