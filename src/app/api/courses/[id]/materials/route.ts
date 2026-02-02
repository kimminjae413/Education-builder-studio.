// src/app/api/courses/[id]/materials/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getCourse, getMaterial, incrementDownloadCount } from '@/lib/db/queries'
import { query } from '@/lib/db/client'

interface MaterialResult {
  id: string
  filename: string
  title: string
  description: string | null
  subject_category: string | null
  target_category: string | null
  file_url: string
  file_type: string
  usage_count: number
  download_count: number
}

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

    console.log(`📚 과정 ${params.id}의 추천 자료 조회 시작...`)

    // 과정 정보 가져오기
    const course = await getCourse(params.id)

    if (!course) {
      console.warn('⚠️ 과정을 찾을 수 없음')
      return NextResponse.json({
        materials: [],
        count: 0,
      })
    }

    // 추천 자료가 없으면 빈 배열 반환
    if (!course.recommended_materials || course.recommended_materials.length === 0) {
      console.log('ℹ️ 추천 자료 없음')
      return NextResponse.json({
        materials: [],
        count: 0,
        message: 'No recommendations yet',
      })
    }

    console.log(`🔍 ${course.recommended_materials.length}개 자료 상세 정보 조회 중...`)

    // 추천 자료 상세 정보 가져오기
    const result = await query<MaterialResult>(
      `SELECT id, filename, title, description, subject_category,
              target_category, file_url, file_type, usage_count, download_count
       FROM teaching_materials
       WHERE id = ANY($1)
         AND status = 'approved'
         AND is_seed_data = true`,
      [course.recommended_materials]
    )

    const materials = result.rows

    // 추천 순서대로 정렬
    const sortedMaterials = course.recommended_materials
      .map((id: string) => materials.find((m) => m.id === id))
      .filter(Boolean)

    console.log(`✅ ${sortedMaterials.length}개 자료 조회 완료`)

    return NextResponse.json({
      materials: sortedMaterials || [],
      count: sortedMaterials?.length || 0,
    })
  } catch (error: unknown) {
    console.error('❌ Get materials error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        materials: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()
    const { materialId } = body

    if (!materialId) {
      return NextResponse.json({ error: 'Material ID required' }, { status: 400 })
    }

    // 다운로드 횟수 증가
    try {
      await incrementDownloadCount(materialId)
    } catch (error) {
      console.error('다운로드 카운트 증가 실패:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('POST materials error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
