// src/app/api/courses/[id]/materials/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 과정 정보 가져오기
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('recommended_materials')
      .eq('id', params.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ materials: [] })
    }

    // 추천 자료가 없으면 빈 배열 반환
    if (!course.recommended_materials || course.recommended_materials.length === 0) {
      return NextResponse.json({ materials: [] })
    }

    // 추천 자료 상세 정보 가져오기
    const { data: materials, error: materialsError } = await supabase
      .from('teaching_materials')
      .select('id, filename, title, description, subject_category, target_category, file_url, file_type')
      .in('id', course.recommended_materials)
      .eq('status', 'approved')
      .order('usage_count', { ascending: false })

    if (materialsError) {
      console.error('Materials fetch error:', materialsError)
      return NextResponse.json({ materials: [] })
    }

    return NextResponse.json({ 
      materials: materials || [],
      count: materials?.length || 0
    })

  } catch (error: any) {
    console.error('Get materials error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
