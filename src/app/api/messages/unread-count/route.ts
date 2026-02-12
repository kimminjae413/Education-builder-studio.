// src/app/api/messages/unread-count/route.ts
// 안읽은 메시지 수 조회 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getUnreadCount } from '@/lib/db/messages'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await getUnreadCount(user.uid)

    return NextResponse.json({
      success: true,
      count,
    })
  } catch (error: unknown) {
    console.error('안읽은 메시지 수 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
