// src/app/api/admin/seed-data/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { updateMaterial } from '@/lib/db/queries'
import { query } from '@/lib/db/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 관리자 권한 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminCheck = await isAdmin(user.uid)
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { is_seed_data, status, review_note } = body

    // teaching_materials 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {}

    // 1. 시드 데이터 토글 처리
    if (is_seed_data !== undefined) {
      updateData.is_seed_data = is_seed_data
      // 시드로 지정하는 경우 자동 승인
      if (is_seed_data) {
        updateData.status = 'approved'
      }
    }

    // 2. 콘텐츠 승인/거부 처리
    if (status !== undefined) {
      updateData.status = status
      updateData.reviewed_by = user.uid
      updateData.reviewed_at = new Date().toISOString()
    }

    // 3. 검토 메모 처리
    if (review_note !== undefined) {
      updateData.review_note = review_note
    }

    // 업데이트할 내용이 없으면 에러
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    console.log('📝 자료 업데이트:', { id, updateData })

    const material = await updateMaterial(id, updateData as Parameters<typeof updateMaterial>[1])

    if (!material) {
      return NextResponse.json(
        { error: 'Failed to update material' },
        { status: 500 }
      )
    }

    // 승인/거부 액션 로그
    if (status) {
      const actionText = status === 'approved' ? '승인' : '거부'
      console.log(`✅ 콘텐츠 ${actionText} 완료:`, {
        materialId: id,
        title: material.title,
        status,
        reviewedBy: user.email,
      })
    }

    return NextResponse.json({
      success: true,
      material,
    })
  } catch (error) {
    console.error('❌ Material update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 자료 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 관리자 권한 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminCheck = await isAdmin(user.uid)
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // 자료 삭제
    await query('DELETE FROM teaching_materials WHERE id = $1', [id])

    console.log('🗑️ 자료 삭제 완료:', { materialId: id, deletedBy: user.email })

    return NextResponse.json({
      success: true,
      message: 'Material deleted',
    })
  } catch (error) {
    console.error('❌ Material delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
