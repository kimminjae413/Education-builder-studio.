// src/app/api/admin/seed-data/bulk-delete/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. 관리자 권한 확인
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

    // 2. 요청 데이터 파싱
    const body = await request.json()
    const { materialIds } = body as { materialIds: string[] }

    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      return NextResponse.json(
        { error: 'Material IDs array required' },
        { status: 400 }
      )
    }

    // 3. 삭제할 자료들 조회
    const { data: materials, error: fetchError } = await supabase
      .from('teaching_materials')
      .select('id, file_url, is_seed_data')
      .in('id', materialIds)

    if (fetchError) {
      return NextResponse.json(
        { error: `Fetch failed: ${fetchError.message}` },
        { status: 500 }
      )
    }

    // 4. 시드 데이터만 필터링
    const seedDataMaterials = materials?.filter(m => m.is_seed_data) || []

    if (seedDataMaterials.length === 0) {
      return NextResponse.json(
        { error: 'No valid seed data found' },
        { status: 404 }
      )
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    }

    // 5. 각 자료 삭제
    for (const material of seedDataMaterials) {
      try {
        // Storage 파일 삭제
        const urlParts = material.file_url.split('/teaching-materials/')
        if (urlParts.length === 2) {
          const filePath = urlParts[1]
          await supabase.storage
            .from('teaching-materials')
            .remove([filePath])
        }

        // DB 삭제
        const { error: deleteError } = await supabase
          .from('teaching_materials')
          .delete()
          .eq('id', material.id)

        if (deleteError) {
          results.failed.push({
            id: material.id,
            error: deleteError.message,
          })
        } else {
          results.success.push(material.id)
        }
      } catch (error) {
        results.failed.push({
          id: material.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      deleted: results.success.length,
      failed: results.failed.length,
      results,
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
