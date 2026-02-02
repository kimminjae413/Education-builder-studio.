// src/app/api/courses/[id]/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getCourse, getMaterialsByTools } from '@/lib/db/queries'
import { query } from '@/lib/db/client'

interface MaterialWithProfile {
  id: string
  title: string
  description: string | null
  filename: string
  thumbnail_url: string | null
  target_category: string | null
  subject_category: string | null
  tool_categories: string[]
  method_categories: string[]
  usage_count: number
  download_count: number
  bookmark_count: number
  rating: number
  rating_count: number
  created_at: Date
  profile_name: string | null
  profile_rank: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 현재 사용자 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 과정 정보 가져오기
    const course = await getCourse(id)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // 추천 로직: 키워드 기반 매칭
    const keywords = [
      course.subject,
      ...course.tools,
      course.target_audience,
    ].filter(Boolean)

    console.log('Recommendation keywords:', keywords)

    // 자료 검색 (도구 기반 + 승인된 자료만)
    const result = await query<MaterialWithProfile>(
      `SELECT
        m.id, m.title, m.description, m.filename, m.thumbnail_url,
        m.target_category, m.subject_category, m.tool_categories,
        m.method_categories, m.usage_count, m.download_count,
        m.bookmark_count, m.rating, m.rating_count, m.created_at,
        p.name as profile_name, p.rank as profile_rank
      FROM teaching_materials m
      LEFT JOIN profiles p ON m.user_id = p.id
      WHERE m.status = 'approved'
      ${course.tools && course.tools.length > 0 ? 'AND m.tool_categories && $1' : ''}
      ORDER BY m.rating DESC, m.download_count DESC
      LIMIT 20`,
      course.tools && course.tools.length > 0 ? [course.tools] : []
    )

    const materials = result.rows

    // 점수 계산 및 정렬
    const scoredMaterials = materials.map((material) => {
      let score = 0

      // 도구 일치도 (40점)
      if (material.tool_categories && course.tools) {
        const matchingTools = material.tool_categories.filter((tool: string) =>
          course.tools.some(
            (courseTool: string) =>
              courseTool.toLowerCase().includes(tool.toLowerCase()) ||
              tool.toLowerCase().includes(courseTool.toLowerCase())
          )
        )
        score += (matchingTools.length / course.tools.length) * 40
      }

      // 대상 일치도 (20점)
      if (material.target_category && course.target_audience) {
        if (
          material.target_category.includes(course.target_audience) ||
          course.target_audience.includes(material.target_category)
        ) {
          score += 20
        }
      }

      // 주제 일치도 (15점)
      if (material.subject_category && course.subject) {
        const subjectKeywords = course.subject.toLowerCase().split(' ')
        const materialSubject = material.subject_category.toLowerCase()
        const matchingKeywords = subjectKeywords.filter((kw: string) =>
          materialSubject.includes(kw)
        )
        score += (matchingKeywords.length / subjectKeywords.length) * 15
      }

      // 인기도 (15점)
      const downloadScore = Math.min(material.download_count / 50, 1) * 7.5
      const ratingScore = material.rating_count > 0 ? (material.rating / 5) * 7.5 : 0
      score += downloadScore + ratingScore

      // 강사 랭크 보너스 (10점)
      const rankScores: Record<string, number> = {
        master: 10,
        veteran: 8,
        senior: 6,
        intermediate: 4,
        junior: 2,
        newcomer: 1,
      }
      const rankScore = rankScores[material.profile_rank || 'newcomer'] || 1
      score += rankScore

      return {
        ...material,
        profiles: {
          name: material.profile_name,
          rank: material.profile_rank,
        },
        recommendation_score: Math.round(score * 10) / 10,
      }
    })

    // 점수 순으로 정렬하고 상위 8개만
    const topRecommendations = scoredMaterials
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 8)

    return NextResponse.json({
      recommendations: topRecommendations,
      total: topRecommendations.length,
      keywords: keywords,
    })
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
