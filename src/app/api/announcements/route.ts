// src/app/api/announcements/route.ts
// 공개 공지사항 목록 API

import { NextRequest, NextResponse } from 'next/server'
import { getPublishedAnnouncements } from '@/lib/db/announcements'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { announcements, total } = await getPublishedAnnouncements(limit, offset)

    return NextResponse.json({ announcements, total })
  } catch (error: unknown) {
    console.error('공지사항 목록 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
