// src/app/api/admin/inquiries/[id]/reply/route.ts
// 관리자 답변 작성

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { getInquiryById, createInquiryReply, updateInquiryStatus } from '@/lib/db/inquiries'

export async function POST(
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
    const inquiry = await getInquiryById(id)
    if (!inquiry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })
    }

    const reply = await createInquiryReply({
      inquiry_id: id,
      author_id: user.uid,
      content: content.trim(),
      is_admin: true,
    })

    // 상태를 자동으로 'in_progress'로 변경 (pending인 경우)
    if (inquiry.status === 'pending') {
      await updateInquiryStatus(id, 'in_progress')
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('관리자 답변 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
