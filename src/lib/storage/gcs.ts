// src/lib/storage/gcs.ts
// Google Cloud Storage 유틸리티

import { Storage, Bucket, File } from '@google-cloud/storage'

let storage: Storage | null = null
let bucket: Bucket | null = null

function getServiceAccountKey() {
  // 여러 환경변수명 시도 (Firebase 서비스 계정도 GCS 접근 가능)
  const key = process.env.GCS_SERVICE_ACCOUNT_KEY
    || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    || process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    || process.env.GOOGLE_CREDENTIALS

  if (!key) {
    console.warn('[GCS] No service account key found in environment variables')
    return null
  }

  try {
    return JSON.parse(key)
  } catch {
    console.warn('[GCS] Failed to parse service account key as JSON')
    return key
  }
}

function getStorage(): Storage {
  if (!storage) {
    const projectId = process.env.GCS_PROJECT_ID
    if (!projectId) {
      throw new Error('GCS_PROJECT_ID is not set')
    }

    const credentials = getServiceAccountKey()

    if (!credentials) {
      throw new Error(
        'GCS 서비스 계정 키가 설정되지 않았습니다. ' +
        'Netlify 환경변수에 GCS_SERVICE_ACCOUNT_KEY 또는 GOOGLE_APPLICATION_CREDENTIALS_JSON을 설정하세요.'
      )
    }

    storage = new Storage({ projectId, credentials })
  }
  return storage
}

function getBucket(): Bucket {
  if (!bucket) {
    const bucketName = process.env.GCS_BUCKET_NAME
    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME is not set')
    }

    bucket = getStorage().bucket(bucketName)
  }
  return bucket
}

// 파일 업로드
export async function uploadFile(
  buffer: Buffer | ArrayBuffer,
  destinationPath: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const bucket = getBucket()
  const file = bucket.file(destinationPath)

  const bufferData = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer

  await file.save(bufferData, {
    contentType,
    metadata: metadata ? { metadata } : undefined,
  })

  // Public URL 반환
  return getPublicUrl(destinationPath)
}

// 파일 다운로드
export async function downloadFile(path: string): Promise<Buffer> {
  const bucket = getBucket()
  const file = bucket.file(path)

  const [content] = await file.download()
  return content
}

// 파일 삭제
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const bucket = getBucket()
    const file = bucket.file(path)
    await file.delete()
    return true
  } catch (error) {
    console.error('Failed to delete file:', error)
    return false
  }
}

// 서명된 URL 생성 (다운로드용)
export async function getSignedUrl(
  path: string,
  expirationMinutes: number = 60
): Promise<string> {
  const bucket = getBucket()
  const file = bucket.file(path)

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expirationMinutes * 60 * 1000,
  })

  return url
}

// 서명된 업로드 URL 생성 (클라이언트 직접 업로드용)
export async function getSignedUploadUrl(
  path: string,
  contentType: string,
  expirationMinutes: number = 15
): Promise<string> {
  const bucket = getBucket()
  const file = bucket.file(path)

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expirationMinutes * 60 * 1000,
    contentType,
  })

  return url
}

// Public URL 생성
export function getPublicUrl(path: string): string {
  const bucketName = process.env.GCS_BUCKET_NAME
  return `https://storage.googleapis.com/${bucketName}/${path}`
}

// 파일 존재 여부 확인
export async function fileExists(path: string): Promise<boolean> {
  try {
    const bucket = getBucket()
    const file = bucket.file(path)
    const [exists] = await file.exists()
    return exists
  } catch {
    return false
  }
}

// 파일 메타데이터 조회
export async function getFileMetadata(path: string): Promise<Record<string, unknown> | null> {
  try {
    const bucket = getBucket()
    const file = bucket.file(path)
    const [metadata] = await file.getMetadata()
    return metadata as Record<string, unknown>
  } catch {
    return null
  }
}

// 디렉토리 내 파일 목록 조회
export async function listFiles(prefix: string): Promise<string[]> {
  const bucket = getBucket()
  const [files] = await bucket.getFiles({ prefix })
  return files.map((file: File) => file.name)
}

// URL에서 GCS 경로 추출
export function extractPathFromUrl(url: string): string | null {
  const bucketName = process.env.GCS_BUCKET_NAME
  const pattern = new RegExp(`https://storage\\.googleapis\\.com/${bucketName}/(.+)`)
  const match = url.match(pattern)
  return match ? match[1] : null
}

// CORS 설정 확인 (한 번만 설정)
export async function configureCors(): Promise<void> {
  const bucket = getBucket()

  await bucket.setCorsConfiguration([
    {
      origin: ['*'], // 프로덕션에서는 도메인 지정
      method: ['GET', 'PUT', 'POST', 'DELETE'],
      maxAgeSeconds: 3600,
      responseHeader: ['Content-Type', 'Authorization'],
    },
  ])

  console.log('GCS CORS configured')
}
