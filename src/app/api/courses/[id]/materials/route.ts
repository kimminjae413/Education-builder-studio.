// src/app/api/courses/[id]/materials/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ⭐ 타입 변경
) {
  try {
    const supabase = await createClient()
    const params = await context.params // ⭐ await 추가
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`📚 과정 ${params.id}의 추천 자료 조회 시작...`)

    // 과정 정보 가져오기
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('recommended_materials')
      .eq('id', params.id)
      .single()

    if (courseError) {
      console.error('❌ 과정 조회 실패:', courseError)
      return NextResponse.json({ 
        materials: [],
        count: 0 
      })
    }

    if (!course) {
      console.warn('⚠️ 과정을 찾을 수 없음')
      return NextResponse.json({ 
        materials: [],
        count: 0 
      })
    }

    // 추천 자료가 없으면 빈 배열 반환
    if (!course.recommended_materials || course.recommended_materials.length === 0) {
      console.log('ℹ️ 추천 자료 없음')
      return NextResponse.json({ 
        materials: [],
        count: 0,
        message: 'No recommendations yet'
      })
    }

    console.log(`🔍 ${course.recommended_materials.length}개 자료 상세 정보 조회 중...`)

    // 추천 자료 상세 정보 가져오기
    const { data: materials, error: materialsError } = await supabase
      .from('teaching_materials')
      .select(`
        id, 
        filename, 
        title, 
        description, 
        subject_category, 
        target_category, 
        file_url, 
        file_type,
        usage_count,
        download_count
      `)
      .in('id', course.recommended_materials)
      .eq('status', 'approved')
      .eq('is_seed_data', true)

    if (materialsError) {
      console.error('❌ 자료 조회 실패:', materialsError)
      return NextResponse.json({ 
        materials: [],
        count: 0,
        error: 'Failed to fetch materials'
      })
    }

    // 추천 순서대로 정렬
    const sortedMaterials = course.recommended_materials
      .map((id: string) => materials?.find(m => m.id === id))
      .filter(Boolean)

    console.log(`✅ ${sortedMaterials.length}개 자료 조회 완료`)

    return NextResponse.json({ 
      materials: sortedMaterials || [],
      count: sortedMaterials?.length || 0
    })

  } catch (error: any) {
    console.error('❌ Get materials error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        materials: [],
        count: 0
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ⭐ 타입 변경
) {
  try {
    const supabase = await createClient()
    const params = await context.params // ⭐ await 추가
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { materialId } = body

    if (!materialId) {
      return NextResponse.json({ error: 'Material ID required' }, { status: 400 })
    }

    // 다운로드 횟수 증가
    // ⭐ FIX: supabase.raw() 대신 클라이언트 사이드 증가 사용
    const { data: current } = await supabase
      .from('teaching_materials')
      .select('download_count')
      .eq('id', materialId)
      .single()
    
    const { error } = await supabase
      .from('teaching_materials')
      .update({ 
        download_count: (current?.download_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', materialId)

    if (error) {
      console.error('다운로드 카운트 증가 실패:', error)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('POST materials error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
