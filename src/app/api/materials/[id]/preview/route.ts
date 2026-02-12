// src/app/api/materials/[id]/preview/route.ts
// GCS Signed URL 기반 파일 미리보기

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'
import { getSignedUrl, extractPathFromUrl } from '@/lib/storage/gcs'

const OFFICE_EXTS = new Set(['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await query<{ gcs_path: string | null; file_url: string; filename: string | null }>(
      `SELECT gcs_path, file_url, filename FROM teaching_materials WHERE id = $1`,
      [id]
    )

    const material = result.rows[0]
    if (!material) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const gcsPath = material.gcs_path || extractPathFromUrl(material.file_url)
    if (!gcsPath) {
      return NextResponse.json({ error: 'File path not found' }, { status: 404 })
    }

    const filename = material.filename || gcsPath.split('/').pop() || ''
    const ext = filename.split('.').pop()?.toLowerCase() || ''

    // Signed URL 생성 (15분 유효)
    const signedUrl = await getSignedUrl(gcsPath, 15)

    // 파일 타입 분류
    const type = OFFICE_EXTS.has(ext) ? 'office' : ext === 'pdf' ? 'pdf' : 'other'

    return NextResponse.json({ url: signedUrl, type })
  } catch (error) {
    console.error('Preview URL error:', error)
    return NextResponse.json({ error: 'Failed to generate preview URL' }, { status: 500 })
  }
}
