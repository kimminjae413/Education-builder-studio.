// src/app/(dashboard)/profile/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RankBadge } from '@/components/rank/RankBadge'
import { RankProgress } from '@/components/rank/RankProgress'
import { InstructorRank } from '@/lib/rank/types'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { ProfileStats } from '@/components/profile/ProfileStats'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 콘텐츠 통계 가져오기
  const { data: materials, count: materialCount } = await supabase
    .from('teaching_materials')
    .select('download_count, rating, rating_count', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', 'approved')

  // 통계 계산
  const totalDownloads = materials?.reduce((sum, m) => sum + (m.download_count || 0), 0) || 0
  const ratedMaterials = materials?.filter(m => m.rating_count > 0) || []
  const avgRating = ratedMaterials.length > 0
    ? ratedMaterials.reduce((sum, m) => sum + m.rating, 0) / ratedMaterials.length
    : 0

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
                  {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              
              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {profile?.name || '이름 없음'}
                </h2>
                <p className="text-gray-600 text-sm truncate">{user.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <RankBadge rank={profile?.rank as InstructorRank} />
                  {profile?.role === 'admin' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                      관리자
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 자기소개 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                자기소개
              </label>
              <p className="text-gray-600 text-sm leading-relaxed">
                {profile?.bio || '자기소개를 작성해주세요'}
              </p>
            </div>

            {/* 가입 정보 */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가입일
                </label>
                <p className="text-gray-900 text-sm">
                  {profile?.created_at && new Date(profile.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  랭크 포인트
                </label>
                <p className="text-gray-900 text-sm font-mono">
                  {profile?.rank_points?.toLocaleString() || 0}점
                </p>
              </div>
            </div>
          </div>

          {/* 랭크 진행 상황 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">랭크 진행 상황</h3>
            <RankProgress
              currentRank={profile?.rank as InstructorRank}
              currentPoints={profile?.rank_points || 0}
            />
          </div>

          {/* 프로필 편집 폼 */}
          <ProfileEditForm 
            profile={{
              id: profile?.id || user.id,
              name: profile?.name,
              bio: profile?.bio,
            }} 
          />
        </div>

        {/* 우측: 통계 (1칸) */}
        <div className="lg:col-span-1">
          <ProfileStats
            profile={{
              rank: profile?.rank as InstructorRank,
            }}
            stats={{
              materialCount: materialCount || 0,
              totalDownloads,
              avgRating,
              aiUsageThisMonth: profile?.ai_usage_count_this_month || 0,
            }}
          />
        </div>
      </div>
    </div>
  )
}
