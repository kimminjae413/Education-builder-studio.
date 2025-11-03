// src/app/api/courses/[id]/recommendations-vector/route.ts
// 벡터 검색 기반 추천 시스템

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const params = await context.params
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🔍 벡터 검색 기반 추천 시작: 과정 ${params.id}`)

    // 과정 정보 가져오기
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', params.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // 🔥 NEW: 과정 정보로 검색 쿼리 생성
    const searchQuery = [
      course.subject,
      course.target_audience,
      course.tools?.join(' '),
      course.learning_objectives
    ].filter(Boolean).join(' ')

    console.log(`📝 검색 쿼리: "${searchQuery}"`)

    // 🔥 NEW: Gemini로 쿼리 임베딩 생성
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const embeddingResult = await model.embedContent(searchQuery)
    const queryEmbedding = embeddingResult.embedding.values

    console.log(`✅ 임베딩 생성 완료 (${queryEmbedding.length}차원)`)

    // 🔥 NEW: 벡터 유사도 검색
    const { data: vectorResults, error: vectorError } = await supabase
      .rpc('match_materials_by_embedding', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,  // 70% 이상 유사도
        match_count: 12        // 상위 12개 (여유있게)
      })

    if (vectorError) {
      console.error('❌ 벡터 검색 실패:', vectorError)
      // 폴백: 기존 키워드 방식으로 전환
      return fallbackKeywordSearch(supabase, course)
    }

    console.log(`✅ 벡터 검색 완료: ${vectorResults?.length || 0}개 발견`)

    if (!vectorResults || vectorResults.length === 0) {
      return NextResponse.json({
        recommendations: [],
        total: 0,
        method: 'vector',
        message: 'No similar materials found'
      })
    }

    // 🎯 하이브리드 점수: 벡터 유사도(70%) + 키워드 보너스(30%)
    const scoredResults = vectorResults.map((material: any) => {
      let score = material.similarity * 70 // 벡터 유사도 70%

      // 키워드 보너스 30%
      let keywordBonus = 0

      // 도구 일치 (15점)
      if (course.tools && material.tool_categories) {
        const matchingTools = material.tool_categories.filter((tool: string) =>
          course.tools.some((courseTool: string) =>
            courseTool.toLowerCase().includes(tool.toLowerCase())
          )
        )
        keywordBonus += (matchingTools.length / (course.tools.length || 1)) * 15
      }

      // 대상 일치 (10점)
      if (material.target_category?.includes(course.target_audience)) {
        keywordBonus += 10
      }

      // 주제 일치 (5점)
      if (material.subject_category?.toLowerCase().includes(course.subject?.toLowerCase())) {
        keywordBonus += 5
      }

      score += keywordBonus

      return {
        ...material,
        recommendation_score: Math.round(score * 10) / 10,
        vector_similarity: Math.round(material.similarity * 100),
        keyword_bonus: Math.round(keywordBonus)
      }
    })

    // 최종 점수 순으로 정렬하고 상위 8개
    const topRecommendations = scoredResults
      .sort((a: any, b: any) => b.recommendation_score - a.recommendation_score)
      .slice(0, 8)

    console.log(`✅ 최종 추천: ${topRecommendations.length}개`)

    return NextResponse.json({
      recommendations: topRecommendations,
      total: topRecommendations.length,
      method: 'vector-hybrid',
      query: searchQuery
    })

  } catch (error) {
    console.error('❌ Vector recommendation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 폴백: 기존 키워드 방식
async function fallbackKeywordSearch(supabase: any, course: any) {
  console.log('⚠️ 벡터 검색 실패, 키워드 방식으로 폴백')
  
  // 기존 키워드 검색 로직
  const { data: materials } = await supabase
    .from('teaching_materials')
    .select('*')
    .eq('status', 'approved')
    .eq('is_seed_data', true)
    .limit(20)

  return NextResponse.json({
    recommendations: materials || [],
    total: materials?.length || 0,
    method: 'keyword-fallback'
  })
}
