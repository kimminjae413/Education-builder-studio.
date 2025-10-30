// src/app/api/admin/seed-data/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { is_seed_data } = body

    if (typeof is_seed_data !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_seed_data value' },
        { status: 400 }
      )
    }

    // 시드 상태 업데이트
    const updateData: any = {
      is_seed_data,
      updated_at: new Date().toISOString(),
    }

    if (is_seed_data) {
      // 시드로 지정
      updateData.seed_approved_by = user.id
      updateData.seed_approved_at = new Date().toISOString()
    } else {
      // 시드 해제
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
        { error: '업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      material: data,
      message: is_seed_data
        ? '시드 데이터로 지정되었습니다'
        : '시드에서 제외되었습니다',
    })

  } catch (error) {
    console.error('Seed toggle error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
