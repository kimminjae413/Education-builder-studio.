// src/lib/reward/usage-tracker.ts
// 자료 사용률 추적 시스템

import { query } from '@/lib/db/client'

export interface UsageStats {
  documentId: string
  referenceCount: number      // RAG 검색에 포함된 횟수
  citationCount: number       // 실제 생성물에 인용된 횟수
  downloadCount: number       // 다운로드 횟수
  viewCount: number           // 조회 횟수
  satisfactionScore: number   // 평균 만족도 (1-5)
  totalScore: number          // 종합 점수
}

export interface ContributorStats {
  userId: string
  userName: string
  totalMaterials: number
  totalReferences: number
  totalCitations: number
  totalDownloads: number
  averageSatisfaction: number
  contributionScore: number
  rank: number
}

/**
 * 자료 조회 기록
 */
export async function trackView(documentId: string, userId?: string): Promise<void> {
  await query(
    `UPDATE teaching_materials
     SET view_count = COALESCE(view_count, 0) + 1
     WHERE id = $1`,
    [documentId]
  )

  if (userId) {
    await query(
      `INSERT INTO material_views (material_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [documentId, userId]
    )
  }
}

/**
 * 자료 다운로드 기록
 */
export async function trackDownload(documentId: string, userId: string): Promise<void> {
  await query(
    `UPDATE teaching_materials
     SET download_count = COALESCE(download_count, 0) + 1
     WHERE id = $1`,
    [documentId]
  )

  await query(
    `INSERT INTO material_downloads (material_id, user_id)
     VALUES ($1, $2)`,
    [documentId, userId]
  )
}

/**
 * RAG 검색 참조 기록
 */
export async function trackReference(documentId: string, courseId?: string): Promise<void> {
  await query(
    `UPDATE teaching_materials
     SET reference_count = COALESCE(reference_count, 0) + 1
     WHERE id = $1`,
    [documentId]
  )
}

/**
 * RAG 인용 기록 (실제 생성물에 사용됨)
 */
export async function trackCitation(documentId: string, courseId: string): Promise<void> {
  await query(
    `UPDATE teaching_materials
     SET citation_count = COALESCE(citation_count, 0) + 1
     WHERE id = $1`,
    [documentId]
  )
}

/**
 * 자료 만족도 평가
 */
export async function rateMaterial(
  documentId: string,
  userId: string,
  rating: number
): Promise<void> {
  // 기존 평가가 있으면 업데이트, 없으면 삽입
  await query(
    `INSERT INTO material_ratings (material_id, user_id, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (material_id, user_id)
     DO UPDATE SET rating = $3, updated_at = NOW()`,
    [documentId, userId, rating]
  )

  // 평균 만족도 업데이트
  await query(
    `UPDATE teaching_materials
     SET satisfaction_score = (
       SELECT AVG(rating)::numeric(2,1)
       FROM material_ratings
       WHERE material_id = $1
     )
     WHERE id = $1`,
    [documentId]
  )
}

/**
 * 자료별 사용 통계 조회
 */
export async function getMaterialUsageStats(documentId: string): Promise<UsageStats | null> {
  const result = await query(
    `SELECT
       id as document_id,
       COALESCE(reference_count, 0) as reference_count,
       COALESCE(citation_count, 0) as citation_count,
       COALESCE(download_count, 0) as download_count,
       COALESCE(view_count, 0) as view_count,
       COALESCE(satisfaction_score, 0) as satisfaction_score
     FROM teaching_materials
     WHERE id = $1`,
    [documentId]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  const totalScore = calculateTotalScore(row)

  return {
    documentId: row.document_id,
    referenceCount: parseInt(row.reference_count),
    citationCount: parseInt(row.citation_count),
    downloadCount: parseInt(row.download_count),
    viewCount: parseInt(row.view_count),
    satisfactionScore: parseFloat(row.satisfaction_score),
    totalScore,
  }
}

/**
 * 종합 점수 계산
 * - 인용: 10점
 * - 참조: 5점
 * - 다운로드: 3점
 * - 조회: 1점
 * - 만족도 보너스: 만족도 * 10
 */
function calculateTotalScore(stats: any): number {
  const citation = parseInt(stats.citation_count) || 0
  const reference = parseInt(stats.reference_count) || 0
  const download = parseInt(stats.download_count) || 0
  const view = parseInt(stats.view_count) || 0
  const satisfaction = parseFloat(stats.satisfaction_score) || 0

  return (citation * 10) + (reference * 5) + (download * 3) + (view * 1) + (satisfaction * 10)
}

/**
 * 기여자별 통계 조회
 */
export async function getContributorStats(userId: string): Promise<ContributorStats | null> {
  const result = await query(
    `SELECT
       p.id as user_id,
       p.name as user_name,
       COUNT(m.id) as total_materials,
       SUM(COALESCE(m.reference_count, 0)) as total_references,
       SUM(COALESCE(m.citation_count, 0)) as total_citations,
       SUM(COALESCE(m.download_count, 0)) as total_downloads,
       AVG(COALESCE(m.satisfaction_score, 0)) as avg_satisfaction
     FROM profiles p
     LEFT JOIN teaching_materials m ON p.id = m.user_id
     WHERE p.id = $1
     GROUP BY p.id, p.name`,
    [userId]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  const contributionScore = calculateContributionScore(row)

  // 랭크 계산 (자료등록 +5점 포함)
  const rankResult = await query(
    `SELECT COUNT(*) + 1 as rank
     FROM (
       SELECT user_id,
         SUM(COALESCE(citation_count, 0) * 10 +
             COALESCE(reference_count, 0) * 5 +
             COALESCE(download_count, 0) * 3) + COUNT(*) * 5 as score
       FROM teaching_materials
       GROUP BY user_id
       HAVING SUM(COALESCE(citation_count, 0) * 10 +
                  COALESCE(reference_count, 0) * 5 +
                  COALESCE(download_count, 0) * 3) + COUNT(*) * 5 > $1
     ) ranked`,
    [contributionScore]
  )

  return {
    userId: row.user_id,
    userName: row.user_name || 'Unknown',
    totalMaterials: parseInt(row.total_materials) || 0,
    totalReferences: parseInt(row.total_references) || 0,
    totalCitations: parseInt(row.total_citations) || 0,
    totalDownloads: parseInt(row.total_downloads) || 0,
    averageSatisfaction: parseFloat(row.avg_satisfaction) || 0,
    contributionScore,
    rank: parseInt(rankResult.rows[0]?.rank) || 1,
  }
}

/**
 * 기여 점수 계산
 */
function calculateContributionScore(stats: any): number {
  const citations = parseInt(stats.total_citations) || 0
  const references = parseInt(stats.total_references) || 0
  const downloads = parseInt(stats.total_downloads) || 0
  const satisfaction = parseFloat(stats.avg_satisfaction) || 0
  const materials = parseInt(stats.total_materials) || 0

  return (citations * 10) + (references * 5) + (downloads * 3) + (satisfaction * 20) + (materials * 5)
}

/**
 * 상위 기여자 목록 조회
 */
export async function getTopContributors(limit: number = 10): Promise<ContributorStats[]> {
  const result = await query(
    `SELECT
       p.id as user_id,
       p.name as user_name,
       COUNT(m.id) as total_materials,
       SUM(COALESCE(m.reference_count, 0)) as total_references,
       SUM(COALESCE(m.citation_count, 0)) as total_citations,
       SUM(COALESCE(m.download_count, 0)) as total_downloads,
       AVG(COALESCE(m.satisfaction_score, 0)) as avg_satisfaction,
       SUM(COALESCE(m.citation_count, 0) * 10 +
           COALESCE(m.reference_count, 0) * 5 +
           COALESCE(m.download_count, 0) * 3 +
           COALESCE(m.satisfaction_score, 0) * 20) + COUNT(m.id) * 5 as contribution_score
     FROM profiles p
     LEFT JOIN teaching_materials m ON p.id = m.user_id
     GROUP BY p.id, p.name
     HAVING COUNT(m.id) > 0
     ORDER BY contribution_score DESC
     LIMIT $1`,
    [limit]
  )

  return result.rows.map((row, index) => ({
    userId: row.user_id,
    userName: row.user_name || 'Unknown',
    totalMaterials: parseInt(row.total_materials) || 0,
    totalReferences: parseInt(row.total_references) || 0,
    totalCitations: parseInt(row.total_citations) || 0,
    totalDownloads: parseInt(row.total_downloads) || 0,
    averageSatisfaction: parseFloat(row.avg_satisfaction) || 0,
    contributionScore: parseFloat(row.contribution_score) || 0,
    rank: index + 1,
  }))
}
