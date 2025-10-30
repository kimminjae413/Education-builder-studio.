// src/app/api/admin/seed-data/delete/route.ts
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
    const { materialId } = body

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID required' },
        { status: 400 }
      )
    }

    // 3. DB에서 자료 정보 조회
    const { data: material, error: fetchError } = await supabase
      .from('teaching_materials')
      .select('file_url, is_seed_data')
      .eq('id', materialId)
      .single()

    if (fetchError || !material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    // 4. 시드 데이터만 삭제 가능 (안전장치)
    if (!material.is_seed_data) {
      return NextResponse.json(
        { error: 'Can only delete seed data' },
        { status: 403 }
      )
    }

    // 5. Storage에서 파일 삭제
    try {
      // file_url에서 파일 경로 추출
      // 예: https://xxx.supabase.co/storage/v1/object/public/teaching-materials/seed/material_123.pdf
      const urlParts = material.file_url.split('/teaching-materials/')
      if (urlParts.length === 2) {
        const filePath = urlParts[1]
        
        const { error: storageError } = await supabase.storage
          .from('teaching-materials')
          .remove([filePath])

        if (storageError) {
          console.error('Storage deletion failed:', storageError)
          // Storage 삭제 실패해도 DB는 삭제 진행
        }
      }
    } catch (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // 6. DB에서 삭제
    const { error: deleteError } = await supabase
      .from('teaching_materials')
      .delete()
      .eq('id', materialId)

    if (deleteError) {
      console.error('DB deletion failed:', deleteError)
      return NextResponse.json(
        { error: `Delete failed: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully',
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
