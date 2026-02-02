// src/app/api/admin/seed-data/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { getMaterial, deleteMaterial } from '@/lib/db/queries'
import { deleteFile, extractPathFromUrl } from '@/lib/storage/gcs'

export async function DELETE(request: NextRequest) {
  try {
    // 1. 관리자 권한 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminCheck = await isAdmin(user.uid)
    if (!adminCheck) {
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
    const material = await getMaterial(materialId)

    if (!material) {
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

    // 5. GCS에서 파일 삭제
    try {
      const gcsPath = material.gcs_path || extractPathFromUrl(material.file_url)
      if (gcsPath) {
        const deleted = await deleteFile(gcsPath)
        if (!deleted) {
          console.error('GCS deletion failed for:', gcsPath)
        }
      }
    } catch (storageError) {
      console.error('Storage deletion error:', storageError)
      // Storage 삭제 실패해도 DB는 삭제 진행
    }

    // 6. DB에서 삭제
    const deleted = await deleteMaterial(materialId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Delete failed' },
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
