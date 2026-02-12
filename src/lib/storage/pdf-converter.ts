// src/lib/storage/pdf-converter.ts
// Office 파일 → PDF 변환 (Google Drive API 사용)

import { GoogleAuth } from 'google-auth-library'
import { downloadFile, uploadFile, fileExists, getSignedUrl } from './gcs'

const OFFICE_EXTENSIONS = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls']

const MIME_MAP: Record<string, string> = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
}

export function isOfficeFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return OFFICE_EXTENSIONS.includes(ext)
}

function getCredentials() {
  const key = process.env.GCS_SERVICE_ACCOUNT_KEY
    || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    || process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY

  if (!key) throw new Error('No service account key found')

  const parsed = JSON.parse(key)
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
  return parsed
}

async function getAccessToken(): Promise<string> {
  const credentials = getCredentials()
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  const client = await auth.getClient()
  const tokenRes = await client.getAccessToken()
  return tokenRes.token!
}

/**
 * Office 파일을 PDF로 변환하고 GCS에 캐시
 * 이미 변환된 PDF가 있으면 캐시된 경로 반환
 */
export async function getPreviewPdfPath(gcsPath: string): Promise<string> {
  // PDF 캐시 경로 (원본 옆에 _preview.pdf로 저장)
  const pdfCachePath = gcsPath.replace(/\.[^.]+$/, '_preview.pdf')

  // 이미 변환된 PDF 캐시가 있으면 바로 반환
  if (await fileExists(pdfCachePath)) {
    return pdfCachePath
  }

  // GCS에서 원본 파일 다운로드
  const fileBuffer = await downloadFile(gcsPath)
  const ext = gcsPath.split('.').pop()?.toLowerCase() || ''
  const mimeType = MIME_MAP[ext]
  if (!mimeType) throw new Error(`Unsupported file type: ${ext}`)

  const token = await getAccessToken()

  // 1. Google Drive에 업로드
  const boundary = `boundary_${Date.now()}`
  const metadata = JSON.stringify({ name: `convert_${Date.now()}.${ext}` })

  const parts = [
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`,
    fileBuffer.toString('base64'),
    `\r\n--${boundary}--`,
  ]

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: parts.join(''),
    }
  )

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    throw new Error(`Drive upload failed (${uploadRes.status}): ${errText}`)
  }

  const { id: fileId } = await uploadRes.json()

  try {
    // 2. PDF로 내보내기
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!exportRes.ok) {
      const errText = await exportRes.text()
      throw new Error(`Drive export failed (${exportRes.status}): ${errText}`)
    }

    const pdfBuffer = Buffer.from(await exportRes.arrayBuffer())

    // 3. GCS에 PDF 캐시 저장
    await uploadFile(pdfBuffer, pdfCachePath, 'application/pdf')

    return pdfCachePath
  } finally {
    // 4. Drive 임시 파일 삭제
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
}
