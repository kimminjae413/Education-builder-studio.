// src/app/api/admin/inquiries/[id]/route.ts
// 관리자 문의 상세 조회

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
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
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const inquiry = await getInquiryById(id)

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
