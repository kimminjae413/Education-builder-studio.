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
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ppt: 'application/vnd.ms-powerpoint',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      hwp: 'application/x-hwp',
      zip: 'application/zip',
    }
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

    // 브라우저에서 인라인 표시 가능한 타입
    const inlineTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
    const disposition = inlineTypes.includes(contentType) ? 'inline' : `attachment; filename="${filePath.split('/').pop()}"`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (error) {
    console.error('Storage proxy error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
