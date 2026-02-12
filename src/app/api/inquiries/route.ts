// src/app/api/inquiries/route.ts
// 내 문의 목록 + 문의 생성

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getMyInquiries, createInquiry } from '@/lib/db/inquiries'

// GET: 내 문의 목록
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { inquiries, total } = await getMyInquiries(user.uid, limit, offset)

    return NextResponse.json({ inquiries, total })
  } catch (error) {
    console.error('문의 목록 조회 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 문의 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, content } = body

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '제목과 내용을 입력해주세요' }, { status: 400 })
    }

    const inquiry = await createInquiry({
      user_id: user.uid,
      subject: subject.trim(),
      content: content.trim(),
    })

    return NextResponse.json({ inquiry }, { status: 201 })
  } catch (error) {
    console.error('문의 생성 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
