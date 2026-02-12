// src/app/api/messages/send/route.ts
// 메시지 전송 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getProfile } from '@/lib/db/queries'
import {
  findConversation,
  createConversation,
  sendMessage,
  getDailyMessageCount,
} from '@/lib/db/messages'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, content } = body

    // 입력 검증
    if (!recipientId || !content) {
      return NextResponse.json(
        { error: 'recipientId와 content는 필수입니다' },
        { status: 400 }
      )
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: '메시지 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: '메시지는 2000자 이하로 입력해주세요' },
        { status: 400 }
      )
    }

    // 자기 자신에게 전송 차단
    if (recipientId === user.uid) {
      return NextResponse.json(
        { error: '자신에게는 메시지를 보낼 수 없습니다' },
        { status: 400 }
      )
    }

    // 수신자 존재 확인
    const recipient = await getProfile(recipientId)
    if (!recipient) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다' },
        { status: 404 }
      )
    }

    // 스팸 제한: 새싹 랭크 일일 5건
    const senderProfile = await getProfile(user.uid)
    if (senderProfile?.rank === 'newcomer') {
      const dailyCount = await getDailyMessageCount(user.uid)
      if (dailyCount >= 5) {
        return NextResponse.json(
          { error: '새싹 등급은 하루 5건까지 메시지를 보낼 수 있습니다' },
          { status: 429 }
        )
      }
    }

    // 기존 대화 찾기 또는 새로 생성
    let conversation = await findConversation(user.uid, recipientId)
    if (!conversation) {
      conversation = await createConversation(user.uid, recipientId)
    }

    // 메시지 전송
    const message = await sendMessage(conversation.id, user.uid, content.trim())

    return NextResponse.json({
      success: true,
      message,
      conversationId: conversation.id,
    })
  } catch (error: unknown) {
    console.error('메시지 전송 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
