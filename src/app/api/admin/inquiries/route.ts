// src/app/api/admin/inquiries/route.ts
// 관리자 전체 문의 목록

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { getAllInquiries, InquiryStatus } from '@/lib/db/inquiries'

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
    const status = searchParams.get('status') as InquiryStatus | null

    const { inquiries, total } = await getAllInquiries(limit, offset, status || undefined)

    return NextResponse.json({ inquiries, total })
  } catch (error) {
    console.error('문의 목록 조회 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
