// src/app/api/materials/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getMaterial, incrementDownloadCount } from '@/lib/db/queries'
import { getSignedUrl, extractPathFromUrl } from '@/lib/storage/gcs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 현재 사용자 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 자료 정보 가져오기
    const material = await getMaterial(id)

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    if (material.status !== 'approved') {
      return NextResponse.json({ error: 'Material not approved' }, { status: 403 })
    }

    // 다운로드 카운트 증가
    try {
      await incrementDownloadCount(id)
    } catch (updateError) {
      console.error('Failed to update download count:', updateError)
    }

    // GCS에서 서명된 URL 생성
    const gcsPath = material.gcs_path || extractPathFromUrl(material.file_url)

    if (!gcsPath) {
      console.error('Failed to extract GCS path from:', material.file_url)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    try {
      const signedUrl = await getSignedUrl(gcsPath, 5) // 5분 유효

      // 서명된 URL로 리다이렉트
      return NextResponse.redirect(signedUrl)
    } catch (gcsError) {
      console.error('Failed to create signed URL:', gcsError)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET 메서드로도 다운로드 가능하도록 (직접 링크 지원)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params })
}
