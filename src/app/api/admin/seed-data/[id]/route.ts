// src/app/api/admin/seed-data/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { updateMaterial } from '@/lib/db/queries'

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
    const { is_seed_data } = body

    // teaching_materials 업데이트
    const updateData: Record<string, unknown> = {
      is_seed_data,
    }

    // 시드로 지정하는 경우
    if (is_seed_data) {
      updateData.status = 'approved' // 시드는 자동 승인
    }

    const material = await updateMaterial(id, updateData as Parameters<typeof updateMaterial>[1])

    if (!material) {
      return NextResponse.json(
        { error: 'Failed to update material' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      material,
    })
  } catch (error) {
    console.error('Seed toggle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
