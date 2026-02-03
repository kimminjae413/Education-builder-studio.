// src/lib/ai/feedback-system.ts
// 사용자 피드백 수집 및 향후 생성에 반영

import { query } from '@/lib/db/client'

export interface CourseFeedback {
  courseId: string
  userId: string
  rating: 1 | 2 | 3 | 4 | 5
  usefulSections: string[]
  improvementAreas: string[]
  selectedType?: 'lecture' | 'practice' | 'pbl'
  comment?: string
}

export interface FeedbackStats {
  averageRating: number
  totalFeedbacks: number
  typePreferences: Record<string, number>
  commonImprovements: string[]
}

/**
 * 피드백 저장
 */
export async function saveFeedback(feedback: CourseFeedback): Promise<{ id: string }> {
  const result = await query(
    `INSERT INTO course_feedbacks
     (course_id, user_id, rating, useful_sections, improvement_areas, selected_type, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      feedback.courseId,
      feedback.userId,
      feedback.rating,
      JSON.stringify(feedback.usefulSections),
      JSON.stringify(feedback.improvementAreas),
      feedback.selectedType || null,
      feedback.comment || null,
    ]
  )

  await updateCourseRating(feedback.courseId)
  return { id: result.rows[0].id }
}

/**
 * 코스 평균 평점 업데이트
 */
async function updateCourseRating(courseId: string): Promise<void> {
  await query(
    `UPDATE courses
     SET average_rating = (
       SELECT AVG(rating)::numeric(2,1)
       FROM course_feedbacks
       WHERE course_id = $1
     ),
     feedback_count = (
       SELECT COUNT(*)
       FROM course_feedbacks
       WHERE course_id = $1
     )
     WHERE id = $1`,
    [courseId]
  )
}

/**
 * 사용자의 피드백 패턴 분석
 */
export async function getUserFeedbackPattern(userId: string): Promise<{
  preferredType: string | null
  averageRating: number
  commonPreferences: string[]
}> {
  const typeResult = await query(
    `SELECT selected_type, COUNT(*) as count
     FROM course_feedbacks
     WHERE user_id = $1 AND selected_type IS NOT NULL
     GROUP BY selected_type
     ORDER BY count DESC
     LIMIT 1`,
    [userId]
  )

  const ratingResult = await query(
    `SELECT AVG(rating) as avg_rating
     FROM course_feedbacks
     WHERE user_id = $1`,
    [userId]
  )

  const sectionsResult = await query(
    `SELECT useful_sections
     FROM course_feedbacks
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  )

  const sectionCounts: Record<string, number> = {}
  for (const row of sectionsResult.rows) {
    const sections = JSON.parse(row.useful_sections || '[]')
    for (const section of sections) {
      sectionCounts[section] = (sectionCounts[section] || 0) + 1
    }
  }

  const commonPreferences = Object.entries(sectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([section]) => section)

  return {
    preferredType: typeResult.rows[0]?.selected_type || null,
    averageRating: parseFloat(ratingResult.rows[0]?.avg_rating) || 0,
    commonPreferences,
  }
}

/**
 * 피드백 기반 생성 힌트 생성
 */
export async function generateFeedbackHints(userId: string): Promise<{
  typeHint: string | null
  emphasisAreas: string[]
  avoidAreas: string[]
}> {
  const pattern = await getUserFeedbackPattern(userId)

  const improvementResult = await query(
    `SELECT improvement_areas
     FROM course_feedbacks
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  )

  const improvementCounts: Record<string, number> = {}
  for (const row of improvementResult.rows) {
    const areas = JSON.parse(row.improvement_areas || '[]')
    for (const area of areas) {
      improvementCounts[area] = (improvementCounts[area] || 0) + 1
    }
  }

  const avoidAreas = Object.entries(improvementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => area)

  return {
    typeHint: pattern.preferredType,
    emphasisAreas: pattern.commonPreferences,
    avoidAreas,
  }
}

/**
 * 피드백을 프롬프트 힌트로 변환
 */
export function feedbackToPromptHint(hints: {
  typeHint: string | null
  emphasisAreas: string[]
  avoidAreas: string[]
}): string {
  const lines: string[] = []

  if (hints.typeHint) {
    const typeNames: Record<string, string> = {
      lecture: '강의 중심',
      practice: '실습 중심',
      pbl: '프로젝트 기반',
    }
    lines.push(`사용자 선호 스타일: ${typeNames[hints.typeHint] || hints.typeHint}`)
  }

  if (hints.emphasisAreas.length > 0) {
    lines.push(`강조할 영역: ${hints.emphasisAreas.join(', ')}`)
  }

  if (hints.avoidAreas.length > 0) {
    lines.push(`개선 필요 영역: ${hints.avoidAreas.join(', ')}`)
  }

  return lines.length > 0 ? `\n[사용자 피드백 기반 힌트]\n${lines.join('\n')}` : ''
}
