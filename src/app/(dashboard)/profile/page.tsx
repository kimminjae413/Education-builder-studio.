import { createClient } from '@/lib/supabase/server'
import { RankBadge } from '@/components/rank/RankBadge'
import { InstructorRank } from '@/lib/rank/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
        <p className="text-gray-600">내 정보를 관리하세요</p>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-cobalt-100 flex items-center justify-center">
            <span className="text-3xl">{profile?.name?.[0] || user.email[0].toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.name || '이름 없음'}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2">
              <RankBadge rank={profile?.rank as InstructorRank} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              자기소개
            </label>
            <p className="text-gray-600">
              {profile?.bio || '자기소개를 작성해주세요'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                가입일
              </label>
              <p className="text-gray-900">
                {new Date(profile?.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할
              </label>
              <p className="text-gray-900">
                {profile?.role === 'admin' ? '관리자' : '강사'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 프로필 편집 (추후 구현) */}
      <div className="bg-gray-50 rounded-2xl p-12 border border-gray-200 text-center">
        <div className="text-4xl mb-4">⚙️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          프로필 편집 기능 (곧 출시)
        </h3>
        <p className="text-gray-600">
          추후 프로필 수정 기능이 추가될 예정입니다
        </p>
      </div>
    </div>
  )
}
