// src/lib/db/messages.ts
// 메시지 시스템 DB 쿼리

import { query, withTransaction } from './client'

// ===== 타입 정의 =====

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  last_message_at: string
  last_message_preview: string | null
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface ConversationWithPartner {
  id: string
  partner_id: string
  partner_name: string
  partner_rank: string
  partner_image: string | null
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
}

export interface UserSearchResult {
  id: string
  name: string
  rank: string
  profile_image_url: string | null
}

// ===== 대화 관련 =====

/**
 * 두 사용자 간 기존 대화 찾기
 * participant_1 < participant_2 순서로 정렬하여 검색
 */
export async function findConversation(
  userId1: string,
  userId2: string
): Promise<Conversation | null> {
  const [p1, p2] = userId1.localeCompare(userId2) < 0 ? [userId1, userId2] : [userId2, userId1]

  const result = await query<Conversation>(
    'SELECT * FROM conversations WHERE participant_1 = $1 AND participant_2 = $2',
    [p1, p2]
  )
  return result.rows[0] || null
}

/**
 * 새 대화 생성
 */
export async function createConversation(
  userId1: string,
  userId2: string
): Promise<Conversation> {
  const [p1, p2] = userId1.localeCompare(userId2) < 0 ? [userId1, userId2] : [userId2, userId1]

  const result = await query<Conversation>(
    `INSERT INTO conversations (participant_1, participant_2)
     VALUES ($1, $2)
     ON CONFLICT (participant_1, participant_2) DO UPDATE SET participant_1 = conversations.participant_1
     RETURNING *`,
    [p1, p2]
  )
  return result.rows[0]
}

/**
 * 내 대화 목록 조회 (상대방 정보 + 안읽은 수 포함)
 */
export async function getConversations(
  userId: string
): Promise<ConversationWithPartner[]> {
  const result = await query<ConversationWithPartner>(
    `SELECT
      c.id,
      c.last_message_at,
      c.last_message_preview,
      CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END as partner_id,
      CASE WHEN c.participant_1 = $1 THEN p2.name ELSE p1.name END as partner_name,
      CASE WHEN c.participant_1 = $1 THEN p2.rank ELSE p1.rank END as partner_rank,
      CASE WHEN c.participant_1 = $1 THEN p2.profile_image_url ELSE p1.profile_image_url END as partner_image,
      (SELECT COUNT(*)::int FROM messages m
       WHERE m.conversation_id = c.id
       AND m.sender_id != $1
       AND m.is_read = FALSE) as unread_count
    FROM conversations c
    JOIN profiles p1 ON c.participant_1 = p1.id
    JOIN profiles p2 ON c.participant_2 = p2.id
    WHERE c.participant_1 = $1 OR c.participant_2 = $1
    ORDER BY c.last_message_at DESC`,
    [userId]
  )
  return result.rows
}

// ===== 메시지 관련 =====

/**
 * 메시지 전송 (트랜잭션: 메시지 INSERT + 대화 UPDATE)
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  return withTransaction(async (client) => {
    // 메시지 삽입
    const msgResult = await client.query<Message>(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conversationId, senderId, content]
    )

    // 대화 마지막 메시지 업데이트
    const preview = content.length > 50 ? content.substring(0, 50) + '...' : content
    await client.query(
      `UPDATE conversations
       SET last_message_at = NOW(), last_message_preview = $2
       WHERE id = $1`,
      [conversationId, preview]
    )

    return msgResult.rows[0]
  })
}

/**
 * 대화의 메시지 목록 조회 (커서 기반 페이지네이션)
 */
export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit: number = 30
): Promise<{ messages: Message[]; hasMore: boolean }> {
  let sql: string
  let params: unknown[]

  if (cursor) {
    sql = `SELECT * FROM messages
           WHERE conversation_id = $1 AND created_at < (SELECT created_at FROM messages WHERE id = $2)
           ORDER BY created_at DESC
           LIMIT $3`
    params = [conversationId, cursor, limit + 1]
  } else {
    sql = `SELECT * FROM messages
           WHERE conversation_id = $1
           ORDER BY created_at DESC
           LIMIT $2`
    params = [conversationId, limit + 1]
  }

  const result = await query<Message>(sql, params)
  const hasMore = result.rows.length > limit
  const messages = hasMore ? result.rows.slice(0, limit) : result.rows

  return { messages, hasMore }
}

/**
 * 대화 진입 시 상대방 메시지 일괄 읽음 처리
 */
export async function markAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
    [conversationId, userId]
  )
}

/**
 * 전체 안읽은 메시지 수
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await query<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.participant_1 = $1 OR c.participant_2 = $1)
     AND m.sender_id != $1
     AND m.is_read = FALSE`,
    [userId]
  )
  return result.rows[0]?.count || 0
}

// ===== 스팸 제한 =====

/**
 * 오늘 전송한 메시지 수 (스팸 제한용)
 */
export async function getDailyMessageCount(userId: string): Promise<number> {
  const result = await query<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM messages
     WHERE sender_id = $1
     AND created_at >= CURRENT_DATE`,
    [userId]
  )
  return result.rows[0]?.count || 0
}

// ===== 유저 검색 =====

/**
 * 이름으로 유저 검색 (자동완성용)
 */
export async function searchUsers(
  searchQuery: string,
  excludeUserId: string
): Promise<UserSearchResult[]> {
  const result = await query<UserSearchResult>(
    `SELECT id, name, rank, profile_image_url
     FROM profiles
     WHERE name ILIKE $1 AND id != $2
     ORDER BY name
     LIMIT 10`,
    [`%${searchQuery}%`, excludeUserId]
  )
  return result.rows
}

/**
 * 대화의 상대방 정보 조회
 */
export async function getConversationPartner(
  conversationId: string,
  userId: string
): Promise<UserSearchResult | null> {
  const result = await query<UserSearchResult>(
    `SELECT p.id, p.name, p.rank, p.profile_image_url
     FROM conversations c
     JOIN profiles p ON p.id = CASE
       WHEN c.participant_1 = $2 THEN c.participant_2
       ELSE c.participant_1
     END
     WHERE c.id = $1
     AND (c.participant_1 = $2 OR c.participant_2 = $2)`,
    [conversationId, userId]
  )
  return result.rows[0] || null
}
