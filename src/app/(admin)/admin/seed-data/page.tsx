// src/app/(admin)/admin/seed-data/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SeedDataUpload } from '@/components/admin/SeedDataUpload'
import { SeedDataTable } from '@/components/admin/SeedDataTable'

export default async function SeedDataPage() {
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

  // 모든 교육 자료 가져오기
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
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시드 데이터 관리</h1>
        <p className="text-gray-600 mt-1">
          새 자료를 업로드하거나 기존 자료를 시드로 지정할 수 있습니다
        </p>
      </div>

      {/* 파일 업로드 섹션 */}
      <SeedDataUpload />

      {/* 기존 자료 관리 */}
      {materials && materials.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📚 기존 자료 관리
          </h2>
          <p className="text-gray-600 mb-4">
            업로드된 자료 중 AI 설계에 참고할 시드 데이터를 지정하거나 해제할 수 있습니다
          </p>
          <SeedDataTable materials={materials} />
        </div>
      )}
    </div>
  )
}
