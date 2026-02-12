// src/app/api/messages/conversations/[id]/route.ts
// 대화 메시지 상세 조회 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import {
  getMessages,
  markAsRead,
  getConversationPartner,
} from '@/lib/db/messages'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params

    // 대화 참여자 확인 (권한 체크)
    const partner = await getConversationPartner(conversationId, user.uid)
    if (!partner) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor') || undefined
    const limit = parseInt(searchParams.get('limit') || '30')

    // 메시지 조회
    const { messages, hasMore } = await getMessages(conversationId, cursor, limit)

    // 상대방 메시지 읽음 처리
    await markAsRead(conversationId, user.uid)

    return NextResponse.json({
      success: true,
      messages,
      partner,
      hasMore,
    })
  } catch (error: unknown) {
    console.error('대화 조회 오류:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error instanceof Error ? error.message : 'Internal server error') },
      { status: 500 }
    )
  }
}
