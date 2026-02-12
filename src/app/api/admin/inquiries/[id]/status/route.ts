// src/app/api/admin/inquiries/[id]/status/route.ts
// 관리자 문의 상태 변경

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { updateInquiryStatus, InquiryStatus } from '@/lib/db/inquiries'

const VALID_STATUSES: InquiryStatus[] = ['pending', 'in_progress', 'resolved', 'closed']

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
    const { status } = body

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `유효하지 않은 상태입니다. (${VALID_STATUSES.join(', ')})` },
        { status: 400 }
      )
    }

    const inquiry = await updateInquiryStatus(id, status)

    if (!inquiry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('상태 변경 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
