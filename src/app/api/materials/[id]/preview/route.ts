// src/app/api/materials/[id]/preview/route.ts
// Office 파일은 PDF 변환 후 미리보기, 나머지는 직접 Signed URL

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'
import { getSignedUrl, extractPathFromUrl } from '@/lib/storage/gcs'
import { isOfficeFile, getPreviewPdfPath } from '@/lib/storage/pdf-converter'

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

    // Office 파일 → PDF 변환 후 signed URL
    if (isOfficeFile(filename)) {
      try {
        const pdfPath = await getPreviewPdfPath(gcsPath)
        const signedUrl = await getSignedUrl(pdfPath, 15)
        return NextResponse.json({ url: signedUrl, converted: true })
      } catch (convError) {
        console.error('PDF conversion failed, falling back to original:', convError)
        // 변환 실패 시 원본 signed URL 반환
        const signedUrl = await getSignedUrl(gcsPath, 15)
        return NextResponse.json({ url: signedUrl, converted: false })
      }
    }

    // PDF, 이미지 등: 직접 signed URL
    const signedUrl = await getSignedUrl(gcsPath, 15)
    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    console.error('Preview URL error:', error)
    return NextResponse.json({ error: 'Failed to generate preview URL' }, { status: 500 })
  }
}
