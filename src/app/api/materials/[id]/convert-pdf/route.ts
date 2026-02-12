// src/app/api/materials/[id]/convert-pdf/route.ts
// Office 파일 → PDF 변환 (Google Drive API + Firebase Admin credential)
// 변환된 PDF는 GCS에 캐시하여 재사용

export const maxDuration = 60 // Netlify Pro: 최대 60초, Free: 26초

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'
import {
  getSignedUrl,
  extractPathFromUrl,
  downloadFile,
  uploadFile,
  fileExists,
} from '@/lib/storage/gcs'
import { getAdminApp } from '@/lib/firebase/admin'

const OFFICE_EXTS = new Set(['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'])

const MIME_MAP: Record<string, string> = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
}

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

    if (!OFFICE_EXTS.has(ext)) {
      return NextResponse.json({ error: 'Not an Office file' }, { status: 400 })
    }

    // 캐시된 PDF 확인
    const pdfCachePath = gcsPath.replace(/\.[^.]+$/, '_preview.pdf')
    if (await fileExists(pdfCachePath)) {
      const pdfUrl = await getSignedUrl(pdfCachePath, 15)
      return NextResponse.json({ url: pdfUrl, cached: true })
    }

    // Firebase Admin SDK에서 액세스 토큰 가져오기
    const app = getAdminApp()
    const credential = app.options.credential!
    const tokenResult = await credential.getAccessToken()
    const accessToken = tokenResult.access_token

    // GCS에서 원본 파일 다운로드
    const fileBuffer = await downloadFile(gcsPath)
    const mimeType = MIME_MAP[ext] || 'application/octet-stream'

    // Google Drive에 업로드
    const boundary = `boundary${Date.now()}`
    const metadata = JSON.stringify({ name: `convert_${Date.now()}.${ext}` })
    const body = [
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`,
      fileBuffer.toString('base64'),
      `\r\n--${boundary}--`,
    ].join('')

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    )

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      console.error('Drive upload failed:', uploadRes.status, errText)
      return NextResponse.json(
        { error: 'Google Drive API 사용이 불가합니다. Google Cloud Console에서 Drive API를 활성화해주세요.' },
        { status: 503 }
      )
    }

    const { id: driveFileId } = await uploadRes.json()

    try {
      // PDF로 내보내기
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${driveFileId}/export?mimeType=application/pdf`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (!exportRes.ok) {
        const errText = await exportRes.text()
        console.error('Drive export failed:', exportRes.status, errText)
        return NextResponse.json({ error: 'PDF 변환 실패' }, { status: 500 })
      }

      const pdfBuffer = Buffer.from(await exportRes.arrayBuffer())

      // GCS에 PDF 캐시 저장
      await uploadFile(pdfBuffer, pdfCachePath, 'application/pdf')

      // PDF signed URL 반환
      const pdfUrl = await getSignedUrl(pdfCachePath, 15)
      return NextResponse.json({ url: pdfUrl, cached: false })
    } finally {
      // Drive 임시 파일 삭제
      fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {})
    }
  } catch (error) {
    console.error('Convert PDF error:', error)
    return NextResponse.json({ error: 'PDF 변환 중 오류 발생' }, { status: 500 })
  }
}
