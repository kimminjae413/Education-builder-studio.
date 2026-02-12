// src/app/api/inquiries/[id]/route.ts
// 문의 상세 조회

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getInquiryById, getInquiryReplies } from '@/lib/db/inquiries'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const inquiry = await getInquiryById(id, user.uid)

    if (!inquiry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const replies = await getInquiryReplies(id)

    return NextResponse.json({ inquiry, replies })
  } catch (error) {
    console.error('문의 상세 조회 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
