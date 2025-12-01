// src/app/api/courses/[id]/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 과정 정보 가져오기
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, subject, tools, target_audience')
      .eq('id', id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // 추천 로직: 키워드 기반 매칭
    const keywords = [
      course.subject,
      ...course.tools,
      course.target_audience
    ].filter(Boolean)

    console.log('Recommendation keywords:', keywords)

    // 1단계: 도구 카테고리 매칭
    let query = supabase
      .from('teaching_materials')
      .select(`
        id,
        title,
        description,
        filename,
        thumbnail_url,
        target_category,
        subject_category,
        tool_categories,
        method_categories,
        usage_count,
        download_count,
        bookmark_count,
        rating,
        rating_count,
        created_at,
        profiles:user_id (
          name,
          rank
        )
      `)
      .eq('status', 'approved')

    // 도구가 있으면 도구 기준으로 필터링
    if (course.tools && course.tools.length > 0) {
      query = query.overlaps('tool_categories', course.tools)
    }

    const { data: materials, error: materialsError } = await query
      .order('rating', { ascending: false })
      .order('download_count', { ascending: false })
      .limit(20)

    if (materialsError) {
      console.error('Materials query error:', materialsError)
      return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
    }

    // 2단계: 점수 계산 및 정렬
    const scoredMaterials = (materials || []).map((material: any) => {
      let score = 0

      // 도구 일치도 (40점)
      if (material.tool_categories && course.tools) {
        const matchingTools = material.tool_categories.filter((tool: string) =>
          course.tools.some((courseTool: string) =>
            courseTool.toLowerCase().includes(tool.toLowerCase()) ||
            tool.toLowerCase().includes(courseTool.toLowerCase())
          )
        )
        score += (matchingTools.length / course.tools.length) * 40
      }

      // 대상 일치도 (20점)
      if (material.target_category && course.target_audience) {
        if (material.target_category.includes(course.target_audience) ||
            course.target_audience.includes(material.target_category)) {
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
        'master': 10,
        'veteran': 8,
        'senior': 6,
        'intermediate': 4,
        'junior': 2,
        'newcomer': 1
      }
      const rankScore = rankScores[material.profiles?.rank || 'newcomer'] || 1
      score += rankScore

      return {
        ...material,
        recommendation_score: Math.round(score * 10) / 10
      }
    })

    // 점수 순으로 정렬하고 상위 8개만
    const topRecommendations = scoredMaterials
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 8)

    return NextResponse.json({
      recommendations: topRecommendations,
      total: topRecommendations.length,
      keywords: keywords
    })

  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
