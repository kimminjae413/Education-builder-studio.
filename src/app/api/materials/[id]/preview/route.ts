// src/app/api/materials/[id]/preview/route.ts
// GCS Signed URL로 파일 미리보기 (프록시 우회, 대용량 파일 지원)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'
import { getSignedUrl, extractPathFromUrl } from '@/lib/storage/gcs'

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

    const result = await query<{ gcs_path: string | null; file_url: string }>(
      `SELECT gcs_path, file_url FROM teaching_materials WHERE id = $1`,
      [id]
    )

    const material = result.rows[0]
    if (!material) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // GCS 경로 결정: gcs_path 우선, 없으면 file_url에서 추출
    const gcsPath = material.gcs_path || extractPathFromUrl(material.file_url)
    if (!gcsPath) {
      return NextResponse.json({ error: 'File path not found' }, { status: 404 })
    }

    // 15분 유효 signed URL 생성
    const signedUrl = await getSignedUrl(gcsPath, 15)

    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    console.error('Preview URL error:', error)
    return NextResponse.json({ error: 'Failed to generate preview URL' }, { status: 500 })
  }
}
