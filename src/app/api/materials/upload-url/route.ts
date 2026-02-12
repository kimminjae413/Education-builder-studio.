// src/app/api/materials/upload-url/route.ts
// 서명된 업로드 URL 발급 (클라이언트 → GCS 직접 업로드용)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getSignedUploadUrl } from '@/lib/storage/gcs'

const ALLOWED_EXTENSIONS = [
  'pdf', 'docx', 'doc', 'pptx', 'ppt',
  'xlsx', 'xls', 'hwp', 'zip',
  'jpg', 'jpeg', 'png',
]

const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename, contentType, fileSize } = await request.json()

    if (!filename || !contentType || !fileSize) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다' }, { status: 400 })
    }

    // 파일 크기 검증
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 200MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    // 확장자 검증
    const ext = filename.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다' },
        { status: 400 }
      )
    }

    // GCS 경로 생성
    const timestamp = Date.now()
    const gcsPath = `materials/${user.uid}/${timestamp}.${ext}`

    // 서명된 업로드 URL 발급 (15분 유효)
    const uploadUrl = await getSignedUploadUrl(gcsPath, contentType, 15)

    return NextResponse.json({
      uploadUrl,
      gcsPath,
    })
  } catch (error) {
    console.error('Upload URL 생성 오류:', error)
    return NextResponse.json(
      { error: 'URL 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
