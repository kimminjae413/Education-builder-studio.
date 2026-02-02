// src/app/api/admin/seed-data/bulk-delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { getMaterial, deleteMaterial } from '@/lib/db/queries'
import { deleteFile, extractPathFromUrl } from '@/lib/storage/gcs'
import { query } from '@/lib/db/client'

interface MaterialInfo {
  id: string
  file_url: string
  gcs_path: string | null
  is_seed_data: boolean
}

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
    const { materialIds } = body as { materialIds: string[] }

    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      return NextResponse.json(
        { error: 'Material IDs array required' },
        { status: 400 }
      )
    }

    // 3. 삭제할 자료들 조회
    const result = await query<MaterialInfo>(
      `SELECT id, file_url, gcs_path, is_seed_data
       FROM teaching_materials
       WHERE id = ANY($1)`,
      [materialIds]
    )

    const materials = result.rows

    // 4. 시드 데이터만 필터링
    const seedDataMaterials = materials.filter((m) => m.is_seed_data)

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
        // GCS 파일 삭제
        const gcsPath = material.gcs_path || extractPathFromUrl(material.file_url)
        if (gcsPath) {
          await deleteFile(gcsPath)
        }

        // DB 삭제
        const deleted = await deleteMaterial(material.id)

        if (!deleted) {
          results.failed.push({
            id: material.id,
            error: 'Failed to delete from database',
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
