// src/lib/db/announcements.ts
// 공지사항 DB 쿼리

import { query } from './client'

// ===== 타입 정의 =====

export interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_published: boolean
  author_id: string
  view_count: number
  created_at: string
  updated_at: string
}

export interface AnnouncementWithAuthor extends Announcement {
  author_name: string
}

// ===== 공개 API (유저용) =====

/**
 * 공개된 공지사항 목록 (최신순, 고정 우선)
 */
export async function getPublishedAnnouncements(
  limit: number = 20,
  offset: number = 0
): Promise<{ announcements: AnnouncementWithAuthor[]; total: number }> {
  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM announcements WHERE is_published = TRUE`
  )
  const total = countResult.rows[0]?.count || 0

  const result = await query<AnnouncementWithAuthor>(
    `SELECT a.*, p.name as author_name
     FROM announcements a
     LEFT JOIN profiles p ON a.author_id = p.id
     WHERE a.is_published = TRUE
     ORDER BY a.is_pinned DESC, a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return { announcements: result.rows, total }
}

/**
 * 고정된 공지사항 목록
 */
export async function getPinnedAnnouncements(): Promise<AnnouncementWithAuthor[]> {
  const result = await query<AnnouncementWithAuthor>(
    `SELECT a.*, p.name as author_name
     FROM announcements a
     LEFT JOIN profiles p ON a.author_id = p.id
     WHERE a.is_published = TRUE AND a.is_pinned = TRUE
     ORDER BY a.created_at DESC
     LIMIT 5`
  )
  return result.rows
}

/**
 * 공지사항 상세 조회 (조회수 증가)
 */
export async function getAnnouncementById(id: string): Promise<AnnouncementWithAuthor | null> {
  // 조회수 증가
  await query(
    `UPDATE announcements SET view_count = view_count + 1 WHERE id = $1`,
    [id]
  )

  const result = await query<AnnouncementWithAuthor>(
    `SELECT a.*, p.name as author_name
     FROM announcements a
     LEFT JOIN profiles p ON a.author_id = p.id
     WHERE a.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

// ===== 읽음 처리 =====

/**
 * 공지사항 읽음 처리 (마지막 확인 시각 기록)
 */
export async function markAnnouncementsRead(userId: string): Promise<void> {
  await query(
    `INSERT INTO announcement_reads (user_id, last_read_at)
     VALUES ($1, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET last_read_at = NOW()`,
    [userId]
  )
}

/**
 * 안읽은 공지사항 수 조회
 */
export async function getUnreadAnnouncementCount(userId: string): Promise<number> {
  const result = await query<{ count: number }>(
    `SELECT COUNT(*)::int as count
     FROM announcements
     WHERE is_published = true
     AND created_at > COALESCE(
       (SELECT last_read_at FROM announcement_reads WHERE user_id = $1),
       '1970-01-01'
     )`,
    [userId]
  )
  return result.rows[0]?.count || 0
}

// ===== 관리자 API =====

/**
 * 전체 공지사항 목록 (관리자용, 비공개 포함)
 */
export async function getAllAnnouncements(
  limit: number = 50,
  offset: number = 0
): Promise<{ announcements: AnnouncementWithAuthor[]; total: number }> {
  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM announcements`
  )
  const total = countResult.rows[0]?.count || 0

  const result = await query<AnnouncementWithAuthor>(
    `SELECT a.*, p.name as author_name
     FROM announcements a
     LEFT JOIN profiles p ON a.author_id = p.id
     ORDER BY a.is_pinned DESC, a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return { announcements: result.rows, total }
}

/**
 * 공지사항 생성
 */
export async function createAnnouncement(data: {
  title: string
  content: string
  is_pinned?: boolean
  is_published?: boolean
  author_id: string
}): Promise<Announcement> {
  const result = await query<Announcement>(
    `INSERT INTO announcements (title, content, is_pinned, is_published, author_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.title, data.content, data.is_pinned ?? false, data.is_published ?? true, data.author_id]
  )
  return result.rows[0]
}

/**
 * 공지사항 수정
 */
export async function updateAnnouncement(
  id: string,
  data: {
    title?: string
    content?: string
    is_pinned?: boolean
    is_published?: boolean
  }
): Promise<Announcement | null> {
  const fields: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }
  if (data.content !== undefined) {
    fields.push(`content = $${paramIndex++}`)
    values.push(data.content)
  }
  if (data.is_pinned !== undefined) {
    fields.push(`is_pinned = $${paramIndex++}`)
    values.push(data.is_pinned)
  }
  if (data.is_published !== undefined) {
    fields.push(`is_published = $${paramIndex++}`)
    values.push(data.is_published)
  }

  if (fields.length === 0) return null

  fields.push(`updated_at = NOW()`)
  values.push(id)

  const result = await query<Announcement>(
    `UPDATE announcements SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  )
  return result.rows[0] || null
}

/**
 * 공지사항 삭제
 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM announcements WHERE id = $1`,
    [id]
  )
  return (result.rowCount ?? 0) > 0
}
