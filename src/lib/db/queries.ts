// src/lib/db/queries.ts
// Cloud SQL 쿼리 함수

import { query, withTransaction } from './client'
import { cache } from 'react'

// ==========================================
// Profiles (사용자 프로필)
// ==========================================

export interface Profile {
  id: string // Firebase UID
  email: string
  name: string | null
  phone: string | null
  bio: string | null
  profile_image_url: string | null // 프로필 이미지 URL
  role: 'user' | 'admin'
  rank: string
  points: number
  ai_usage_count_this_month: number
  created_at: Date
  updated_at: Date
}

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const result = await query<Profile>(
    'SELECT * FROM profiles WHERE id = $1',
    [userId]
  )
  const profile = result.rows[0] || null
  if (profile?.profile_image_url?.includes('storage.googleapis.com')) {
    const match = profile.profile_image_url.match(/storage\.googleapis\.com\/[^/]+\/(.+)/)
    if (match) profile.profile_image_url = `/api/storage/${match[1]}`
  }
  return profile
})

export async function createProfile(profile: Partial<Profile>): Promise<Profile> {
  const result = await query<Profile>(
    `INSERT INTO profiles (id, email, name, role, rank, points, ai_usage_count_this_month)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      profile.id,
      profile.email,
      profile.name || null,
      profile.role || 'user',
      profile.rank || 'newcomer',
      profile.points || 0,
      profile.ai_usage_count_this_month || 0,
    ]
  )
  return result.rows[0]
}

// updateProfile 허용 컬럼 화이트리스트 (SQL injection 방어)
const PROFILE_ALLOWED_COLUMNS = [
  'name', 'phone', 'bio', 'profile_image_url', 'role', 'rank', 'points',
  'ai_usage_count_this_month', 'manual_rank_override', 'manual_rank_reason', 'rank_updated_at',
]

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const fields = Object.keys(updates).filter(f => PROFILE_ALLOWED_COLUMNS.includes(f))
  if (fields.length === 0) return null
  const values = fields.map(f => (updates as Record<string, unknown>)[f])
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')

  const result = await query<Profile>(
    `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId, ...values]
  )
  return result.rows[0] || null
}

export async function incrementAIUsage(userId: string): Promise<void> {
  await query(
    `UPDATE profiles SET ai_usage_count_this_month = ai_usage_count_this_month + 1 WHERE id = $1`,
    [userId]
  )
}

// ==========================================
// Teaching Materials (교육 자료)
// ==========================================

export interface TeachingMaterial {
  id: string
  user_id: string
  filename: string
  file_url: string
  gcs_path: string | null // GCS 경로 추가
  file_size: number
  file_type: string
  title: string
  description: string | null
  content_text: string | null
  target_category: string | null
  subject_category: string | null
  tool_categories: string[]
  method_categories: string[]
  difficulty: string
  learning_objectives: string | null
  status: 'pending' | 'approved' | 'rejected'
  is_seed_data: boolean
  indexed: boolean // Gemini File Search 인덱싱 여부
  chunking_status: string | null // RAG 청킹 상태: pending, processing, completed, failed
  chunk_count: number | null // 청크 개수
  usage_count: number
  download_count: number
  bookmark_count: number
  rating: number
  rating_count: number
  metadata: Record<string, unknown>
  seed_approved_at: Date | null
  seed_approved_by: string | null
  review_note: string | null
  reviewed_at: Date | null
  reviewed_by: string | null
  created_at: Date
  updated_at: Date
}

export async function getMaterial(id: string): Promise<TeachingMaterial | null> {
  const result = await query<TeachingMaterial>(
    'SELECT * FROM teaching_materials WHERE id = $1',
    [id]
  )
  return result.rows[0] || null
}

export async function getMaterialsByUser(userId: string): Promise<TeachingMaterial[]> {
  const result = await query<TeachingMaterial>(
    'SELECT * FROM teaching_materials WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  )
  return result.rows
}

export async function getApprovedSeedMaterials(limit: number = 20): Promise<TeachingMaterial[]> {
  const result = await query<TeachingMaterial>(
    `SELECT * FROM teaching_materials
     WHERE status = 'approved' AND is_seed_data = true
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows
}

export async function createMaterial(
  material: Partial<TeachingMaterial>
): Promise<TeachingMaterial> {
  const result = await query<TeachingMaterial>(
    `INSERT INTO teaching_materials (
      user_id, filename, file_url, gcs_path, file_size, file_type, title, description,
      content_text, target_category, subject_category, tool_categories, method_categories,
      difficulty, learning_objectives, status, is_seed_data, indexed, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *`,
    [
      material.user_id,
      material.filename,
      material.file_url,
      material.gcs_path || null,
      material.file_size,
      material.file_type,
      material.title,
      material.description || null,
      material.content_text || null,
      material.target_category || null,
      material.subject_category || null,
      material.tool_categories || [],
      material.method_categories || [],
      material.difficulty || 'medium',
      material.learning_objectives || null,
      material.status || 'pending',
      material.is_seed_data || false,
      material.indexed || false,
      material.metadata || {},
    ]
  )
  return result.rows[0]
}

// updateMaterial 허용 컬럼 화이트리스트 (SQL injection 방어)
const MATERIAL_ALLOWED_COLUMNS = [
  'title', 'description', 'content_text', 'target_category', 'subject_category',
  'tool_categories', 'method_categories', 'difficulty', 'learning_objectives',
  'status', 'indexed', 'chunking_status', 'chunk_count', 'gcs_path',
  'reference_count', 'citation_count', 'content_type', 'auto_category', 'auto_tags',
  'review_note', 'reviewed_at', 'reviewed_by', 'seed_approved_at', 'seed_approved_by',
  'is_seed_data', 'usage_count', 'download_count', 'bookmark_count', 'rating', 'rating_count',
  'view_count', 'satisfaction_score', 'auto_main_category', 'auto_sub_category',
  'auto_content_type', 'auto_target_grade', 'auto_difficulty', 'classification_confidence',
  'file_url', 'filename', 'metadata',
]

export async function updateMaterial(
  id: string,
  updates: Partial<TeachingMaterial>
): Promise<TeachingMaterial | null> {
  const fields = Object.keys(updates).filter(f => MATERIAL_ALLOWED_COLUMNS.includes(f))
  if (fields.length === 0) return null
  const values = fields.map(f => (updates as Record<string, unknown>)[f])
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')

  const result = await query<TeachingMaterial>(
    `UPDATE teaching_materials SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  )
  return result.rows[0] || null
}

export async function deleteMaterial(id: string): Promise<boolean> {
  const result = await query('DELETE FROM teaching_materials WHERE id = $1', [id])
  return (result.rowCount ?? 0) > 0
}

export async function incrementDownloadCount(id: string): Promise<void> {
  await query(
    'UPDATE teaching_materials SET download_count = download_count + 1 WHERE id = $1',
    [id]
  )
}

// Gemini File Search 인덱싱 대기 자료 조회
export async function getMaterialsForIndexing(
  limit: number = 50
): Promise<TeachingMaterial[]> {
  const result = await query<TeachingMaterial>(
    `SELECT * FROM teaching_materials
     WHERE status = 'approved' AND is_seed_data = true AND indexed = false
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit]
  )
  return result.rows
}

// Gemini File Search 인덱싱 완료 표시
export async function markAsIndexed(id: string): Promise<void> {
  await query(
    'UPDATE teaching_materials SET indexed = true WHERE id = $1',
    [id]
  )
}

// ==========================================
// Courses (교육 과정)
// ==========================================

export interface Course {
  id: string
  user_id: string
  title: string
  target_audience: string
  subject: string
  tools: string[]
  duration: number
  session_count: number
  knowledge_goals: string[]
  skill_goals: string[]
  attitude_goals: string[]
  lecture_ratio: number
  practice_ratio: number
  project_ratio: number
  ai_generated_content: Record<string, unknown>
  lesson_plan: string
  activities: unknown[]
  materials_needed: string[]
  ai_model_used: string
  ai_prompt_used: string
  generation_time_ms: number
  status: string
  recommended_materials: string[]
  views_count: number
  created_at: Date
  updated_at: Date
}

export async function getCourse(id: string): Promise<Course | null> {
  const result = await query<Course>('SELECT * FROM courses WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function createCourse(course: Partial<Course>): Promise<Course> {
  const result = await query<Course>(
    `INSERT INTO courses (
      user_id, title, target_audience, subject, tools, duration, session_count,
      knowledge_goals, skill_goals, attitude_goals, lecture_ratio, practice_ratio,
      project_ratio, ai_generated_content, lesson_plan, activities, materials_needed,
      ai_model_used, ai_prompt_used, generation_time_ms, status, recommended_materials
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *`,
    [
      course.user_id,
      course.title,
      course.target_audience,
      course.subject,
      course.tools || [],
      course.duration,
      course.session_count,
      course.knowledge_goals || [],
      course.skill_goals || [],
      course.attitude_goals || [],
      course.lecture_ratio,
      course.practice_ratio,
      course.project_ratio,
      JSON.stringify(course.ai_generated_content || {}),
      course.lesson_plan,
      JSON.stringify(course.activities || []),
      course.materials_needed || [],
      course.ai_model_used,
      course.ai_prompt_used,
      course.generation_time_ms,
      course.status || 'completed',
      course.recommended_materials || [],
    ]
  )
  return result.rows[0]
}

// ==========================================
// 벡터 검색 대체 (Gemini File Search API로 이동)
// ==========================================

// 키워드 기반 자료 검색 (폴백용)
export async function searchMaterialsByKeyword(
  keyword: string,
  limit: number = 10
): Promise<TeachingMaterial[]> {
  const result = await query<TeachingMaterial>(
    `SELECT * FROM teaching_materials
     WHERE status = 'approved'
     AND (
       title ILIKE $1
       OR description ILIKE $1
       OR subject_category ILIKE $1
       OR $2 = ANY(tool_categories)
     )
     ORDER BY download_count DESC
     LIMIT $3`,
    [`%${keyword}%`, keyword.toLowerCase(), limit]
  )
  return result.rows
}

// 도구 카테고리로 자료 검색
export async function getMaterialsByTools(
  tools: string[],
  limit: number = 20
): Promise<TeachingMaterial[]> {
  const result = await query<TeachingMaterial>(
    `SELECT * FROM teaching_materials
     WHERE status = 'approved'
     AND tool_categories && $1
     ORDER BY download_count DESC
     LIMIT $2`,
    [tools, limit]
  )
  return result.rows
}

// ==========================================
// Admin Queries (관리자용 쿼리)
// ==========================================

// 관리자 통계
export interface AdminStats {
  total_instructors: number
  total_materials: number
  pending_materials: number
  total_usage: number
  total_downloads: number
  newcomer_count: number
  junior_count: number
  intermediate_count: number
  senior_count: number
  veteran_count: number
  master_count: number
}

export async function getAdminStats(): Promise<AdminStats | null> {
  // 강사 수
  const instructorResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM profiles WHERE role = 'user'`
  )
  const totalInstructors = parseInt(instructorResult.rows[0]?.count || '0')

  // 자료 통계
  const materialResult = await query<{ total: string; pending: string; downloads: string }>(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COALESCE(SUM(download_count), 0) as downloads
     FROM teaching_materials`
  )

  // 랭크별 분포
  const rankResult = await query<{ rank: string; count: string }>(
    `SELECT rank, COUNT(*) as count FROM profiles WHERE role = 'user' GROUP BY rank`
  )
  const rankCounts: Record<string, number> = {}
  rankResult.rows.forEach(row => {
    rankCounts[row.rank] = parseInt(row.count)
  })

  // 총 사용량 (AI 사용)
  const usageResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(ai_usage_count_this_month), 0) as total FROM profiles`
  )

  return {
    total_instructors: totalInstructors,
    total_materials: parseInt(materialResult.rows[0]?.total || '0'),
    pending_materials: parseInt(materialResult.rows[0]?.pending || '0'),
    total_usage: parseInt(usageResult.rows[0]?.total || '0'),
    total_downloads: parseInt(materialResult.rows[0]?.downloads || '0'),
    newcomer_count: rankCounts['newcomer'] || 0,
    junior_count: rankCounts['junior'] || 0,
    intermediate_count: rankCounts['intermediate'] || 0,
    senior_count: rankCounts['senior'] || 0,
    veteran_count: rankCounts['veteran'] || 0,
    master_count: rankCounts['master'] || 0,
  }
}

// 최근 가입 사용자 조회
export async function getRecentUsers(limit: number = 5): Promise<Profile[]> {
  const result = await query<Profile>(
    `SELECT * FROM profiles WHERE role = 'user' ORDER BY created_at DESC LIMIT $1`,
    [limit]
  )
  return result.rows
}

// 모든 프로필 조회
export async function getAllProfiles(): Promise<Profile[]> {
  const result = await query<Profile>(
    `SELECT * FROM profiles ORDER BY created_at DESC`
  )
  return result.rows
}

// 프로필과 자료 수 함께 조회 (관리자용)
export interface ProfileWithMaterialCount extends Profile {
  material_count: number
  approved_count: number
  pending_count: number
}

export async function getAllProfilesWithMaterialCounts(): Promise<ProfileWithMaterialCount[]> {
  const result = await query<ProfileWithMaterialCount>(
    `SELECT
      p.*,
      COALESCE(m.material_count, 0)::int as material_count,
      COALESCE(m.approved_count, 0)::int as approved_count,
      COALESCE(m.pending_count, 0)::int as pending_count
     FROM profiles p
     LEFT JOIN (
       SELECT
         user_id,
         COUNT(*) as material_count,
         COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_count
       FROM teaching_materials
       GROUP BY user_id
     ) m ON p.id = m.user_id
     ORDER BY p.created_at DESC`
  )
  return result.rows
}

// ==========================================
// Materials (자료) 관련 추가 쿼리
// ==========================================

// 모든 자료 조회 (관리자용)
export interface MaterialWithUploader extends TeachingMaterial {
  uploader_name: string | null
  uploader_email: string | null
  uploader_rank: string | null
  reviewer_name: string | null
  reviewer_email: string | null
}

export async function getAllMaterialsWithUploader(): Promise<MaterialWithUploader[]> {
  const result = await query<MaterialWithUploader>(
    `SELECT
      m.*,
      p.name as uploader_name,
      p.email as uploader_email,
      p.rank as uploader_rank,
      r.name as reviewer_name,
      r.email as reviewer_email
     FROM teaching_materials m
     LEFT JOIN profiles p ON m.user_id = p.id
     LEFT JOIN profiles r ON m.reviewed_by = r.id
     ORDER BY m.created_at DESC`
  )
  return result.rows
}

// 자료 카운트와 함께 조회
export async function getMaterialsWithCount(userId: string): Promise<{
  materials: TeachingMaterial[]
  count: number
}> {
  const result = await query<TeachingMaterial>(
    `SELECT * FROM teaching_materials WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  )
  return {
    materials: result.rows,
    count: result.rows.length
  }
}

// ==========================================
// Courses (과정) 관련 추가 쿼리
// ==========================================

// 사용자의 과정 조회
export async function getCoursesByUser(userId: string, limit?: number): Promise<Course[]> {
  const sql = limit
    ? `SELECT * FROM courses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`
    : `SELECT * FROM courses WHERE user_id = $1 ORDER BY created_at DESC`
  const params = limit ? [userId, limit] : [userId]
  const result = await query<Course>(sql, params)
  return result.rows
}

// 과정과 제작자 정보 함께 조회
export interface CourseWithCreator extends Course {
  creator_name: string | null
  creator_email: string | null
  creator_rank: string | null
}

export async function getCourseWithCreator(id: string): Promise<CourseWithCreator | null> {
  const result = await query<CourseWithCreator>(
    `SELECT
      c.*,
      p.name as creator_name,
      p.email as creator_email,
      p.rank as creator_rank
     FROM courses c
     LEFT JOIN profiles p ON c.user_id = p.id
     WHERE c.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

// 과정 조회수 증가
export async function incrementCourseViews(id: string): Promise<void> {
  await query(
    `UPDATE courses SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1`,
    [id]
  )
}

// ==========================================
// Statistics (통계) 관련 쿼리
// ==========================================

// 사용자 자료 통계
export interface UserMaterialStats {
  totalCount: number
  approvedCount: number
  totalDownloads: number
  avgRating: number
}

export async function getUserMaterialStats(userId: string): Promise<UserMaterialStats> {
  const result = await query<{
    total_count: string
    approved_count: string
    total_downloads: string
    avg_rating: string
  }>(
    `SELECT
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
      COALESCE(SUM(download_count), 0) as total_downloads,
      COALESCE(AVG(rating) FILTER (WHERE rating_count > 0), 0) as avg_rating
     FROM teaching_materials
     WHERE user_id = $1`,
    [userId]
  )

  const row = result.rows[0]
  return {
    totalCount: parseInt(row?.total_count || '0'),
    approvedCount: parseInt(row?.approved_count || '0'),
    totalDownloads: parseInt(row?.total_downloads || '0'),
    avgRating: parseFloat(row?.avg_rating || '0'),
  }
}

// ==========================================
// Document Chunks (RAG용 문서 청크)
// ==========================================

export interface DocumentChunk {
  id: string
  document_id: string
  chunk_index: number
  content: string
  token_count: number
  embedding: number[] | null
  metadata: Record<string, unknown>
  created_at: Date
  document_title?: string
  similarity?: number
}

export async function createChunk(chunk: {
  document_id: string
  chunk_index: number
  content: string
  token_count: number
  embedding?: number[]
  metadata?: Record<string, unknown>
}): Promise<DocumentChunk> {
  const embeddingStr = chunk.embedding ? `{${chunk.embedding.join(',')}}` : null

  const result = await query<DocumentChunk>(
    `INSERT INTO document_chunks (document_id, chunk_index, content, token_count, embedding, metadata)
     VALUES ($1, $2, $3, $4, $5::double precision[], $6)
     RETURNING *`,
    [chunk.document_id, chunk.chunk_index, chunk.content, chunk.token_count, embeddingStr, JSON.stringify(chunk.metadata || {})]
  )
  return result.rows[0]
}

export async function createChunksBatch(chunks: {
  document_id: string
  chunk_index: number
  content: string
  token_count: number
  embedding?: number[]
  metadata?: Record<string, unknown>
}[]): Promise<number> {
  if (chunks.length === 0) return 0

  const values: unknown[] = []
  const placeholders: string[] = []

  chunks.forEach((chunk, i) => {
    const offset = i * 6
    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}::double precision[], $${offset + 6})`)
    values.push(chunk.document_id, chunk.chunk_index, chunk.content, chunk.token_count, chunk.embedding ? `{${chunk.embedding.join(',')}}` : null, JSON.stringify(chunk.metadata || {}))
  })

  const result = await query(`INSERT INTO document_chunks (document_id, chunk_index, content, token_count, embedding, metadata) VALUES ${placeholders.join(', ')}`, values)
  return result.rowCount || 0
}

export async function getChunksByDocumentId(documentId: string): Promise<DocumentChunk[]> {
  const result = await query<DocumentChunk>('SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index', [documentId])
  return result.rows
}

export async function deleteChunksByDocumentId(documentId: string): Promise<number> {
  const result = await query('DELETE FROM document_chunks WHERE document_id = $1', [documentId])
  return result.rowCount || 0
}

export async function updateMaterialChunkingStatus(materialId: string, status: string, chunkCount?: number): Promise<void> {
  if (chunkCount !== undefined) {
    await query('UPDATE teaching_materials SET chunking_status = $2, chunk_count = $3, updated_at = NOW() WHERE id = $1', [materialId, status, chunkCount])
  } else {
    await query('UPDATE teaching_materials SET chunking_status = $2, updated_at = NOW() WHERE id = $1', [materialId, status])
  }
}

export async function searchSimilarChunks(queryEmbedding: number[], options: { topK?: number; minScore?: number; documentIds?: string[] } = {}): Promise<DocumentChunk[]> {
  const { topK = 10, documentIds } = options
  const embeddingStr = `{${queryEmbedding.join(',')}}`

  // 문서 필터
  const docFilter = documentIds && documentIds.length > 0 ? `AND dc.document_id = ANY($3::uuid[])` : ''

  const result = await query<DocumentChunk>(
    `SELECT dc.*, tm.title as document_title,
      (SELECT SUM(a * b) / (SQRT(SUM(a * a)) * SQRT(SUM(b * b)))
       FROM unnest(dc.embedding, $1::double precision[]) AS t(a, b)) as similarity
     FROM document_chunks dc
     JOIN teaching_materials tm ON dc.document_id = tm.id
     WHERE dc.embedding IS NOT NULL ${docFilter}
     ORDER BY similarity DESC NULLS LAST
     LIMIT $2`,
    documentIds && documentIds.length > 0 ? [embeddingStr, topK, documentIds] : [embeddingStr, topK]
  )

  return result.rows
}

// ==========================================
// RAG Citations (인용 추적)
// ==========================================

export interface RAGCitation {
  id: string
  course_id: string
  chunk_id: string
  document_id: string
  relevance_score: number
  cited_in_output: boolean
  created_at: Date
}

export async function createCitation(citation: { course_id: string; chunk_id: string; document_id: string; relevance_score: number; cited_in_output?: boolean }): Promise<RAGCitation> {
  const result = await query<RAGCitation>(
    `INSERT INTO rag_citations (course_id, chunk_id, document_id, relevance_score, cited_in_output) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [citation.course_id, citation.chunk_id, citation.document_id, citation.relevance_score, citation.cited_in_output || false]
  )
  return result.rows[0]
}

export async function incrementDocumentReferenceCount(documentId: string): Promise<void> {
  await query('UPDATE teaching_materials SET reference_count = COALESCE(reference_count, 0) + 1 WHERE id = $1', [documentId])
}

export async function incrementDocumentCitationCount(documentId: string): Promise<void> {
  await query('UPDATE teaching_materials SET citation_count = COALESCE(citation_count, 0) + 1 WHERE id = $1', [documentId])
}
