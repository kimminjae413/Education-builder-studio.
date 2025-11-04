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
    console.log('📤 파일 업로드 요청 시작')

    const supabase = await createClient()
    
    // 1. 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ 인증 오류:', authError)
      return NextResponse.json({ error: '인증 오류가 발생했습니다' }, { status: 401 })
    }

    if (!user) {
      console.error('❌ 사용자 없음')
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    console.log('✅ 사용자 인증 완료:', user.email)

    // 2. FormData 파싱
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (parseError) {
      console.error('❌ FormData 파싱 실패:', parseError)
      return NextResponse.json({ error: 'FormData 파싱에 실패했습니다' }, { status: 400 })
    }

    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const targetCategory = formData.get('target_category') as string
    const subjectCategory = formData.get('subject_category') as string

    console.log('📋 업로드 정보:', {
      filename: file?.name,
      size: file?.size,
      type: file?.type,
      title: title,
      targetCategory: targetCategory,
      subjectCategory: subjectCategory
    })

    // 3. 파일 존재 확인
    if (!file) {
      console.error('❌ 파일 없음')
      return NextResponse.json({ error: '파일을 선택해주세요' }, { status: 400 })
    }

    // 4. 제목 확인
    if (!title || title.trim() === '') {
      console.error('❌ 제목 없음')
      return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 })
    }

    // 5. 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      console.error('❌ 파일 크기 초과:', file.size)
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    // 6. 파일 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.error('❌ 지원하지 않는 파일 형식:', file.type)
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다' },
        { status: 400 }
      )
    }

    // 7. 파일명 생성 (충돌 방지)
    const timestamp = Date.now()
    const fileName = `${user.id}/${timestamp}_${file.name}`

    console.log('☁️ Storage 업로드 시작:', fileName)

    // 8. Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('teaching-materials')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Storage 업로드 실패:', uploadError)
      return NextResponse.json(
        { error: `파일 업로드 실패: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Storage 업로드 완료:', uploadData.path)

    // 9. 파일 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('teaching-materials')
      .getPublicUrl(fileName)

    console.log('🔗 Public URL 생성:', publicUrl)

    // 10. teaching_materials 테이블에 메타데이터 저장
    console.log('💾 데이터베이스 저장 시작')

    const { data: material, error: dbError } = await supabase
      .from('teaching_materials')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        title: title.trim(),
        description: description?.trim() || null,
        target_category: targetCategory || null,
        subject_category: subjectCategory || null,
        status: 'pending', // 승인 대기
        is_seed_data: false, // 기본값
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ 데이터베이스 저장 실패:', dbError)
      
      // DB 저장 실패 시 업로드된 파일 삭제
      console.log('🗑️ 업로드된 파일 삭제 시도...')
      await supabase.storage
        .from('teaching-materials')
        .remove([fileName])
      
      return NextResponse.json(
        { error: `데이터 저장 실패: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ 데이터베이스 저장 완료:', material.id)

    // 11. 성공 응답
    return NextResponse.json({
      success: true,
      material,
      message: '파일이 성공적으로 업로드되었습니다',
    })

  } catch (error: any) {
    console.error('❌ 업로드 중 예상치 못한 오류:', error)
    return NextResponse.json(
      { error: `업로드 중 오류 발생: ${error.message || '알 수 없는 오류'}` },
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
