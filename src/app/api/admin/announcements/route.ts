// src/app/api/admin/announcements/route.ts
// 관리자 공지사항 목록 + 생성 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { getAllAnnouncements, createAnnouncement } from '@/lib/db/announcements'

// GET: 전체 공지사항 목록
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { announcements, total } = await getAllAnnouncements(limit, offset)

    return NextResponse.json({ announcements, total })
  } catch (error) {
    console.error('공지사항 목록 조회 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 공지사항 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, is_pinned, is_published } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '제목과 내용을 입력해주세요' }, { status: 400 })
    }

    const announcement = await createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      is_pinned: is_pinned ?? false,
      is_published: is_published ?? true,
      author_id: user.uid,
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('공지사항 생성 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
