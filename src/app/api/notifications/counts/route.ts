// src/app/api/notifications/counts/route.ts
// 통합 알림 카운트 (메시지, 공지사항, 1:1 문의)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { query } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3개 카운트를 병렬로 조회
    const [messagesResult, announcementsResult, inquiriesResult] = await Promise.all([
      // 1) 안읽은 메시지 수
      query<{ count: number }>(
        `SELECT COUNT(*)::int as count
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE m.is_read = false
         AND m.sender_id != $1
         AND (c.participant_1 = $1 OR c.participant_2 = $1)`,
        [user.uid]
      ),
      // 2) 유저가 아직 확인하지 않은 새 공지사항 수
      query<{ count: number }>(
        `SELECT COUNT(*)::int as count
         FROM announcements
         WHERE is_published = true
         AND created_at > COALESCE(
           (SELECT last_read_at FROM announcement_reads WHERE user_id = $1),
           '1970-01-01'
         )`,
        [user.uid]
      ),
      // 3) 관리자 답변이 있는데 유저가 아직 확인 안 한 문의 수
      // (마지막 답글이 관리자 답변인 문의)
      query<{ count: number }>(
        `SELECT COUNT(*)::int as count
         FROM inquiries i
         WHERE i.user_id = $1
         AND i.status IN ('in_progress', 'resolved')
         AND EXISTS (
           SELECT 1 FROM inquiry_replies r
           WHERE r.inquiry_id = i.id
           AND r.is_admin = true
           AND r.created_at > COALESCE(
             (SELECT MAX(r2.created_at) FROM inquiry_replies r2
              WHERE r2.inquiry_id = i.id AND r2.is_admin = false),
             i.created_at
           )
         )`,
        [user.uid]
      ),
    ])

    return NextResponse.json({
      messages: messagesResult.rows[0]?.count || 0,
      announcements: announcementsResult.rows[0]?.count || 0,
      inquiries: inquiriesResult.rows[0]?.count || 0,
    })
  } catch (error) {
    console.error('알림 카운트 조회 오류:', error)
    return NextResponse.json({ messages: 0, announcements: 0, inquiries: 0 })
  }
}
