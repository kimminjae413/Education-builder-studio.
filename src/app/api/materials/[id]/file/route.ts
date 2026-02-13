// src/app/api/materials/[id]/file/route.ts
// GCS 파일 프록시 - 원본 파일을 스트리밍 (외부 뷰어용 공개 URL)

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'
import { downloadFile, extractPathFromUrl } from '@/lib/storage/gcs'

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  hwp: 'application/haansofthwp',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const filename = material.filename || gcsPath.split('/').pop() || 'file'
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const contentType = MIME_MAP[ext] || 'application/octet-stream'

    const fileBuffer = await downloadFile(gcsPath)

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('File proxy error:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
