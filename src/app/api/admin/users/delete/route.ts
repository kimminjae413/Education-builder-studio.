// src/app/api/admin/users/delete/route.ts
import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    // ⭐ Service Role Key로 Supabase Admin 클라이언트 생성
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 일반 클라이언트 (권한 확인용)
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    // 1. 현재 사용자 확인
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      )
    }

    // 2. 관리자 권한 확인
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (currentProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 3. 삭제할 사용자 ID 가져오기
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 4. 자기 자신은 삭제 불가
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 5. 삭제할 사용자 정보 가져오기 (로그용)
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('email, name, role')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 6. 다른 관리자는 삭제 불가 (안전장치)
    if (targetProfile.role === 'admin') {
      return NextResponse.json(
        { error: '다른 관리자는 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    console.log('🗑️ 사용자 삭제 시작:', {
      deletedBy: currentUser.email,
      targetUser: targetProfile.email,
      targetName: targetProfile.name,
      userId
    })

    // 7. Supabase Admin API로 사용자 완전 삭제
    // ⭐ 중요: 이 작업은 auth.users 테이블에서 사용자를 완전히 제거합니다
    // CASCADE 설정으로 profiles, teaching_materials 등도 자동 삭제됨
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('❌ 사용자 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: `삭제 실패: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ 사용자 삭제 완료:', targetProfile.email)

    // 8. 성공 응답
    return NextResponse.json({
      success: true,
      message: `${targetProfile.name} (${targetProfile.email}) 계정이 완전히 삭제되었습니다.`,
      deletedUser: {
        email: targetProfile.email,
        name: targetProfile.name
      }
    })

  } catch (error: any) {
    console.error('❌ 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
