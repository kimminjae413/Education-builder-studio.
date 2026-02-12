// src/app/api/messages/conversations/route.ts
// 대화 목록 조회 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getConversations } from '@/lib/db/messages'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await getConversations(user.uid)

    return NextResponse.json({
      success: true,
      conversations,
    })
  } catch (error: unknown) {
    console.error('대화 목록 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
