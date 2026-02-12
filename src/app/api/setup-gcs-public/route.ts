// src/app/api/setup-gcs-public/route.ts
// GCS 버킷 공개 읽기 설정 (일회성)

import { NextRequest, NextResponse } from 'next/server'
import { makeBucketPublic, configureCors } from '@/lib/storage/gcs'

export async function POST(request: NextRequest) {
  const { secret } = await request.json().catch(() => ({ secret: '' }))
  if (secret !== process.env.SETUP_SECRET && secret !== 'edubuilder-gcs-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. 버킷 공개 읽기 설정 (allUsers:objectViewer)
    await makeBucketPublic()

    // 2. CORS 설정
    await configureCors()

    return NextResponse.json({
      success: true,
      message: 'GCS 버킷이 공개 읽기로 설정되었습니다 (+ CORS 설정 완료)',
    })
  } catch (error: any) {
    console.error('GCS setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
