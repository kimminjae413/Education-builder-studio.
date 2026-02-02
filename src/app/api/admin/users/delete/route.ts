// src/app/api/admin/users/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { deleteUser as deleteFirebaseUser } from '@/lib/firebase/admin'
import { getProfile } from '@/lib/db/queries'
import { query as dbQuery } from '@/lib/db/client'

export async function DELETE(request: NextRequest) {
  try {
    // 1. 현재 사용자 확인
    const currentUser = await getAuthenticatedUser(request)

    if (!currentUser) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      )
    }

    // 2. 관리자 권한 확인
    const adminCheck = await isAdmin(currentUser.uid)

    if (!adminCheck) {
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
    if (userId === currentUser.uid) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 5. 삭제할 사용자 정보 가져오기 (로그용)
    const targetProfile = await getProfile(userId)

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
      userId,
    })

    // 7. 관련 데이터 삭제 (CASCADE가 설정되어 있지 않은 경우)
    // profiles 테이블에서 먼저 삭제
    try {
      await dbQuery('DELETE FROM profiles WHERE id = $1', [userId])
    } catch (dbError) {
      console.error('❌ 프로필 삭제 실패:', dbError)
    }

    // 8. Firebase Auth에서 사용자 삭제
    try {
      await deleteFirebaseUser(userId)
    } catch (deleteError) {
      console.error('❌ Firebase 사용자 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: `삭제 실패: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('✅ 사용자 삭제 완료:', targetProfile.email)

    // 9. 성공 응답
    return NextResponse.json({
      success: true,
      message: `${targetProfile.name} (${targetProfile.email}) 계정이 완전히 삭제되었습니다.`,
      deletedUser: {
        email: targetProfile.email,
        name: targetProfile.name,
      },
    })
  } catch (error: unknown) {
    console.error('❌ 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
