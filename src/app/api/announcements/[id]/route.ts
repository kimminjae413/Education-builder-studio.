// src/app/api/announcements/[id]/route.ts
// 공지사항 상세 API

import { NextRequest, NextResponse } from 'next/server'
import { getAnnouncementById } from '@/lib/db/announcements'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const announcement = await getAnnouncementById(id)

    if (!announcement) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!announcement.is_published) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ announcement })
  } catch (error: unknown) {
    console.error('공지사항 상세 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
