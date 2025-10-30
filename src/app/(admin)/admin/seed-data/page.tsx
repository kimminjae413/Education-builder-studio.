// src/app/(admin)/admin/seed-data/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SeedDataTable } from '@/components/admin/SeedDataTable'

export default async function AdminSeedDataPage() {
  const supabase = await createClient()
  
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

  // 모든 승인된 콘텐츠 조회 (프로필 정보 포함)
  const { data: materials } = await supabase
    .from('teaching_materials')
    .select(`
      *,
      profiles:user_id (
        name,
        email,
        rank
      ),
      seed_approver:seed_approved_by (
        name,
        email
      )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // 시드 통계
  const seedMaterials = materials?.filter(m => m.is_seed_data) || []
  const regularMaterials = materials?.filter(m => !m.is_seed_data) || []

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시드 데이터 관리</h1>
        <p className="text-gray-600">
          AI가 과정 설계 시 참고하는 자료를 관리합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gold-100 flex items-center justify-center">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {seedMaterials.length}
              </div>
              <div className="text-sm text-gray-600">시드 데이터</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-cobalt-100 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {regularMaterials.length}
              </div>
              <div className="text-sm text-gray-600">일반 콘텐츠</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {materials?.length || 0}
              </div>
              <div className="text-sm text-gray-600">전체 승인됨</div>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-cobalt-50 border border-cobalt-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="font-semibold text-cobalt-900 mb-1">
              시드 데이터란?
            </h3>
            <p className="text-sm text-cobalt-700 leading-relaxed">
              AI 설계 마법사가 교육과정을 만들 때 참고하는 검증된 자료입니다.
              베테랑 강사의 우수한 자료를 시드로 지정하면, AI가 더 정확하고 실용적인 과정을 추천할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 테이블 */}
      <SeedDataTable materials={materials || []} />
    </div>
  )
}
