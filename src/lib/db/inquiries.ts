// src/lib/db/inquiries.ts
// 1:1 문의 + 답변 DB 쿼리

import { query } from './client'

// ===== 타입 정의 =====

export type InquiryStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

export interface Inquiry {
  id: string
  user_id: string
  subject: string
  content: string
  status: InquiryStatus
  created_at: string
  updated_at: string
}

export interface InquiryWithUser extends Inquiry {
  user_name: string
  user_email: string
  reply_count: number
}

export interface InquiryReply {
  id: string
  inquiry_id: string
  author_id: string
  content: string
  is_admin: boolean
  created_at: string
}

export interface InquiryReplyWithAuthor extends InquiryReply {
  author_name: string
}

// ===== 유저 API =====

/**
 * 내 문의 목록
 */
export async function getMyInquiries(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ inquiries: InquiryWithUser[]; total: number }> {
  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM inquiries WHERE user_id = $1`,
    [userId]
  )
  const total = countResult.rows[0]?.count || 0

  const result = await query<InquiryWithUser>(
    `SELECT i.*, p.name as user_name, p.email as user_email,
     (SELECT COUNT(*)::int FROM inquiry_replies r WHERE r.inquiry_id = i.id) as reply_count
     FROM inquiries i
     LEFT JOIN profiles p ON i.user_id = p.id
     WHERE i.user_id = $1
     ORDER BY i.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return { inquiries: result.rows, total }
}

/**
 * 문의 상세 조회 (유저 - 본인 것만)
 */
export async function getInquiryById(
  id: string,
  userId?: string
): Promise<InquiryWithUser | null> {
  let sql = `SELECT i.*, p.name as user_name, p.email as user_email,
     (SELECT COUNT(*)::int FROM inquiry_replies r WHERE r.inquiry_id = i.id) as reply_count
     FROM inquiries i
     LEFT JOIN profiles p ON i.user_id = p.id
     WHERE i.id = $1`
  const params: unknown[] = [id]

  if (userId) {
    sql += ` AND i.user_id = $2`
    params.push(userId)
  }

  const result = await query<InquiryWithUser>(sql, params)
  return result.rows[0] || null
}

/**
 * 문의 생성
 */
export async function createInquiry(data: {
  user_id: string
  subject: string
  content: string
}): Promise<Inquiry> {
  const result = await query<Inquiry>(
    `INSERT INTO inquiries (user_id, subject, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.user_id, data.subject, data.content]
  )
  return result.rows[0]
}

/**
 * 문의 답글 목록
 */
export async function getInquiryReplies(inquiryId: string): Promise<InquiryReplyWithAuthor[]> {
  const result = await query<InquiryReplyWithAuthor>(
    `SELECT r.*, p.name as author_name
     FROM inquiry_replies r
     LEFT JOIN profiles p ON r.author_id = p.id
     WHERE r.inquiry_id = $1
     ORDER BY r.created_at ASC`,
    [inquiryId]
  )
  return result.rows
}

/**
 * 답글 생성
 */
export async function createInquiryReply(data: {
  inquiry_id: string
  author_id: string
  content: string
  is_admin: boolean
}): Promise<InquiryReply> {
  const result = await query<InquiryReply>(
    `INSERT INTO inquiry_replies (inquiry_id, author_id, content, is_admin)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.inquiry_id, data.author_id, data.content, data.is_admin]
  )

  // 문의 업데이트 시간 갱신
  await query(
    `UPDATE inquiries SET updated_at = NOW() WHERE id = $1`,
    [data.inquiry_id]
  )

  return result.rows[0]
}

// ===== 관리자 API =====

/**
 * 전체 문의 목록 (관리자용)
 */
export async function getAllInquiries(
  limit: number = 50,
  offset: number = 0,
  status?: InquiryStatus
): Promise<{ inquiries: InquiryWithUser[]; total: number }> {
  let countSql = `SELECT COUNT(*)::int as count FROM inquiries`
  let listSql = `SELECT i.*, p.name as user_name, p.email as user_email,
     (SELECT COUNT(*)::int FROM inquiry_replies r WHERE r.inquiry_id = i.id) as reply_count
     FROM inquiries i
     LEFT JOIN profiles p ON i.user_id = p.id`

  const countParams: unknown[] = []
  const listParams: unknown[] = []

  if (status) {
    countSql += ` WHERE status = $1`
    countParams.push(status)
    listSql += ` WHERE i.status = $1`
    listParams.push(status)
    listSql += ` ORDER BY i.created_at DESC LIMIT $2 OFFSET $3`
    listParams.push(limit, offset)
  } else {
    listSql += ` ORDER BY i.created_at DESC LIMIT $1 OFFSET $2`
    listParams.push(limit, offset)
  }

  const countResult = await query<{ count: number }>(countSql, countParams)
  const total = countResult.rows[0]?.count || 0

  const result = await query<InquiryWithUser>(listSql, listParams)
  return { inquiries: result.rows, total }
}

/**
 * 문의 상태 변경 (관리자)
 */
export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus
): Promise<Inquiry | null> {
  const result = await query<Inquiry>(
    `UPDATE inquiries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  )
  return result.rows[0] || null
}
