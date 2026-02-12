// src/app/api/materials/[id]/convert-pdf/route.ts
// Office 파일 → PDF 변환 (Google Drive API + google-auth-library)
// 변환된 PDF는 GCS에 캐시하여 재사용
// Resumable upload 방식으로 대용량 파일 지원

export const maxDuration = 60

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
import { GoogleAuth } from 'google-auth-library'

const OFFICE_EXTS = new Set(['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'])

const MIME_MAP: Record<string, string> = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
}

// 서비스 계정 크레덴셜에서 Drive 스코프 토큰 발급
async function getDriveAccessToken(): Promise<string> {
  const keyJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    || process.env.GCS_SERVICE_ACCOUNT_KEY
    || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

  if (!keyJson) throw new Error('No service account key found')

  const parsed = JSON.parse(keyJson)
  if (parsed.private_key) {
    let pk = parsed.private_key
    pk = pk.replace(/\\\\n/g, '\n')
    pk = pk.replace(/\\n/g, '\n')
    pk = pk.split('\\n').join('\n')
    pk = pk.replace(/-----BEGIN\s*PRIVATE\s*KEY-----/gi, '-----BEGIN PRIVATE KEY-----')
    pk = pk.replace(/-----END\s*PRIVATE\s*KEY-----/gi, '-----END PRIVATE KEY-----')
    pk = pk.replace(/-----BEGIN PRIVATE KEY-----\s*/g, '-----BEGIN PRIVATE KEY-----\n')
    pk = pk.replace(/\s*-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
    parsed.private_key = pk
  }

  const auth = new GoogleAuth({
    credentials: parsed,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  const client = await auth.getClient()
  const tokenRes = await client.getAccessToken()
  if (!tokenRes.token) throw new Error('Failed to get access token')
  return tokenRes.token
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

    // Drive 스코프 토큰 발급
    const accessToken = await getDriveAccessToken()

    // GCS에서 원본 파일 다운로드
    const fileBuffer = await downloadFile(gcsPath)
    const mimeType = MIME_MAP[ext] || 'application/octet-stream'

    // Resumable upload 세션 생성 (대용량 파일 지원, base64 불필요)
    const initRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': String(fileBuffer.length),
        },
        body: JSON.stringify({ name: `convert_${Date.now()}.${ext}` }),
      }
    )

    if (!initRes.ok) {
      const errText = await initRes.text()
      console.error('Drive resumable init failed:', initRes.status, errText)
      return NextResponse.json(
        { error: 'Google Drive API 사용이 불가합니다. Google Cloud Console에서 Drive API를 활성화해주세요.', detail: errText },
        { status: 503 }
      )
    }

    const resumableUri = initRes.headers.get('Location')
    if (!resumableUri) {
      return NextResponse.json({ error: 'No resumable URI returned' }, { status: 500 })
    }

    // 바이너리 데이터 직접 업로드 (base64 변환 없음 → 메모리 절약)
    const uploadRes = await fetch(resumableUri, {
      method: 'PUT',
      headers: {
        'Content-Length': String(fileBuffer.length),
        'Content-Type': mimeType,
      },
      body: new Uint8Array(fileBuffer),
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      console.error('Drive upload failed:', uploadRes.status, errText)
      return NextResponse.json({ error: 'Drive 업로드 실패', detail: errText }, { status: 500 })
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
        return NextResponse.json({ error: 'PDF 변환 실패', detail: errText }, { status: 500 })
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
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'PDF 변환 중 오류 발생', detail: msg }, { status: 500 })
  }
}
