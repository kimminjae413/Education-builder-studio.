// src/app/api/admin/announcements/[id]/route.ts
// 관리자 공지사항 수정 + 삭제 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { updateAnnouncement, deleteAnnouncement } from '@/lib/db/announcements'

// PATCH: 공지사항 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, content, is_pinned, is_published } = body

    const announcement = await updateAnnouncement(id, {
      title, content, is_pinned, is_published,
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('공지사항 수정 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const success = await deleteAnnouncement(id)

    if (!success) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('공지사항 삭제 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
