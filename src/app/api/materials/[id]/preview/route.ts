// src/app/api/materials/[id]/preview/route.ts
// 파일 미리보기용 Signed URL 생성
// Office 파일: PDF 변환 시도 → 실패 시 원본 URL 반환

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'
import { getSignedUrl, extractPathFromUrl, fileExists } from '@/lib/storage/gcs'

const OFFICE_EXTS = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls']

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
    const isOffice = OFFICE_EXTS.includes(ext)

    // Office 파일: 캐시된 PDF가 있으면 사용, 없으면 변환 시도
    if (isOffice) {
      const pdfCachePath = gcsPath.replace(/\.[^.]+$/, '_preview.pdf')

      // 1) 이미 변환된 PDF 캐시 확인
      if (await fileExists(pdfCachePath)) {
        const pdfUrl = await getSignedUrl(pdfCachePath, 15)
        return NextResponse.json({ url: pdfUrl, type: 'pdf' })
      }

      // 2) PDF 변환 시도 (동적 import로 번들 분리)
      try {
        const { getPreviewPdfPath } = await import('@/lib/storage/pdf-converter')
        const pdfPath = await getPreviewPdfPath(gcsPath)
        const pdfUrl = await getSignedUrl(pdfPath, 15)
        return NextResponse.json({ url: pdfUrl, type: 'pdf' })
      } catch (convError) {
        console.error('PDF conversion failed:', convError)
      }

      // 3) 변환 실패: 원본 signed URL + office 타입 반환 (프론트에서 뷰어 사용)
      const signedUrl = await getSignedUrl(gcsPath, 15)
      return NextResponse.json({ url: signedUrl, type: 'office' })
    }

    // PDF, 이미지 등: 직접 signed URL
    const signedUrl = await getSignedUrl(gcsPath, 15)
    return NextResponse.json({ url: signedUrl, type: ext === 'pdf' ? 'pdf' : 'other' })
  } catch (error) {
    console.error('Preview URL error:', error)
    return NextResponse.json({ error: 'Failed to generate preview URL' }, { status: 500 })
  }
}
