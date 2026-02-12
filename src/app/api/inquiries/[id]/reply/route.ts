// src/app/api/inquiries/[id]/reply/route.ts
// 유저 답글 작성

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getInquiryById, createInquiryReply } from '@/lib/db/inquiries'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 본인 문의인지 확인
    const inquiry = await getInquiryById(id, user.uid)
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
      is_admin: false,
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('답글 작성 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
