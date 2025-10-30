// src/app/api/materials/upload/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 허용 파일 타입
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint', // ppt
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/x-hwp', // hwp
  'application/haansofthwp', // hwp (alternative)
  'application/zip',
  'image/jpeg',
  'image/png',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const targetCategory = formData.get('target_category') as string
    const subjectCategory = formData.get('subject_category') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다' },
        { status: 400 }
      )
    }

    // 파일명 생성 (충돌 방지)
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${timestamp}_${file.name}`

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('teaching-materials')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다' },
        { status: 500 }
      )
    }

    // 파일 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('teaching-materials')
      .getPublicUrl(fileName)

    // teaching_materials 테이블에 메타데이터 저장
    const { data: material, error: dbError } = await supabase
      .from('teaching_materials')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        title: title || file.name,
        description: description || null,
        target_category: targetCategory || null,
        subject_category: subjectCategory || null,
        status: 'pending', // 승인 대기
        is_seed_data: false, // 기본값
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      
      // DB 저장 실패 시 업로드된 파일 삭제
      await supabase.storage
        .from('teaching-materials')
        .remove([fileName])
      
      return NextResponse.json(
        { error: '메타데이터 저장에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      material,
      message: '파일이 성공적으로 업로드되었습니다',
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 파일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const isSeed = searchParams.get('is_seed')

    let query = supabase
      .from('teaching_materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (isSeed === 'true') {
      query = query.eq('is_seed_data', true)
    }

    const { data: materials, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ materials })

  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: '목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
