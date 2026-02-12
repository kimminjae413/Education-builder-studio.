// src/app/api/storage/[...path]/route.ts
// GCS 이미지 프록시 (버킷 공개 설정 없이 이미지 제공)

import { NextRequest, NextResponse } from 'next/server'
import { downloadFile, getFileMetadata } from '@/lib/storage/gcs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = path.join('/')

    // 경로 검증 (디렉토리 탐색 방지)
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // 파일 다운로드
    const buffer = await downloadFile(filePath)

    // Content-Type 추정
    const ext = filePath.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    }
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (error) {
    console.error('Storage proxy error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
