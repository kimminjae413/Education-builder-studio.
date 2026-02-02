// src/app/api/courses/[id]/recommendations-vector/route.ts
// 키워드 기반 추천 시스템 (Gemini RAG용)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getCourse, getApprovedSeedMaterials } from '@/lib/db/queries'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    // 인증 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🔍 자료 추천 시작: 과정 ${params.id}`)

    // 과정 정보 가져오기
    const course = await getCourse(params.id)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // DB에서 시드 데이터 조회
    const materials = await getApprovedSeedMaterials(20)

    if (!materials || materials.length === 0) {
      return NextResponse.json({
        recommendations: [],
        total: 0,
        method: 'keyword-search',
        message: 'No materials found',
      })
    }

    // 키워드 추출
    const keywords = [
      ...(course.subject?.toLowerCase().split(' ') || []),
      ...(course.target_audience?.toLowerCase().split(' ') || []),
      ...(course.tools?.map((t: string) => t.toLowerCase()) || []),
    ].filter(Boolean)

    console.log(`📝 검색 키워드: ${keywords.join(', ')}`)

    // 키워드 매칭으로 점수 계산
    const scoredResults = materials.map((material) => {
      let score = 0
      const titleLower = material.title.toLowerCase()
      const descLower = (material.description || '').toLowerCase()

      // 키워드 매칭
      keywords.forEach(kw => {
        if (titleLower.includes(kw)) score += 10
        if (descLower.includes(kw)) score += 5
      })

      // 도구 일치 보너스
      if (course.tools && material.tool_categories) {
        const matchingTools = material.tool_categories.filter((tool: string) =>
          course.tools.some((courseTool: string) =>
            courseTool.toLowerCase().includes(tool.toLowerCase())
          )
        )
        score += matchingTools.length * 15
      }

      // 대상 일치 보너스
      if (material.target_category?.includes(course.target_audience)) {
        score += 20
      }

      return {
        id: material.id,
        title: material.title,
        description: material.description,
        file_url: material.file_url,
        target_category: material.target_category,
        subject_category: material.subject_category,
        tool_categories: material.tool_categories,
        recommendation_score: score,
      }
    })

    // 점수순 정렬 후 상위 8개
    const topRecommendations = scoredResults
      .filter(r => r.recommendation_score > 0)
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 8)

    console.log(`✅ 최종 추천: ${topRecommendations.length}개`)

    return NextResponse.json({
      recommendations: topRecommendations,
      total: topRecommendations.length,
      method: 'keyword-search',
      keywords,
    })
  } catch (error) {
    console.error('❌ Recommendation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
