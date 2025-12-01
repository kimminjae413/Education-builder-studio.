// src/app/api/admin/seed-data/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { is_seed_data } = body

    // teaching_materials 업데이트
    const updateData: any = {
      is_seed_data,
      updated_at: new Date().toISOString()
    }

    // 시드로 지정하는 경우
    if (is_seed_data) {
      updateData.seed_approved_by = user.id
      updateData.seed_approved_at = new Date().toISOString()
      updateData.status = 'approved' // 시드는 자동 승인
    } else {
      // 시드 해제하는 경우
      updateData.seed_approved_by = null
      updateData.seed_approved_at = null
    }

    const { data, error } = await supabase
      .from('teaching_materials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update material' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      material: data
    })

  } catch (error) {
    console.error('Seed toggle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
