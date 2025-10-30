// src/app/api/admin/seed-data/upload/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 파일 검증
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // 파일명에서 메타데이터 추출 시도
    const filename = file.name
    const fileExtension = filename.split('.').pop()?.toLowerCase()
    
    // 학년 추출 (파일명 또는 경로에서)
    let targetCategory = '초등'
    if (filename.includes('EL001') || filename.includes('유치')) {
      targetCategory = '유치부'
    } else if (filename.includes('EL002') || filename.includes('1학년')) {
      targetCategory = '초등 1학년'
    } else if (filename.includes('EL003') || filename.includes('2학년')) {
      targetCategory = '초등 2학년'
    } else if (filename.includes('EL004') || filename.includes('3학년')) {
      targetCategory = '초등 3학년'
    } else if (filename.includes('EL005') || filename.includes('4학년')) {
      targetCategory = '초등 4학년'
    } else if (filename.includes('EL006') || filename.includes('5학년')) {
      targetCategory = '초등 5학년'
    } else if (filename.includes('EL007') || filename.includes('6학년')) {
      targetCategory = '초등 6학년'
    } else if (filename.includes('EL008') || filename.includes('저학년')) {
      targetCategory = '초등 저학년'
    } else if (filename.includes('EL009') || filename.includes('중학년')) {
      targetCategory = '초등 중학년'
    } else if (filename.includes('EL010') || filename.includes('고학년')) {
      targetCategory = '초등 고학년'
    }

    // 파일을 Supabase Storage에 업로드
    const fileBuffer = await file.arrayBuffer()
    const fileName = `seed/${Date.now()}_${filename}`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('teaching-materials')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'File upload failed' },
        { status: 500 }
      )
    }

    // 파일 URL 생성
    const { data: { publicUrl } } = supabase
      .storage
      .from('teaching-materials')
      .getPublicUrl(fileName)

    // 파일 내용 텍스트 추출 (간단한 버전 - PDF는 추후 개선)
    let contentText = ''
    try {
      if (fileExtension === 'txt' || fileExtension === 'md') {
        contentText = await file.text()
      } else {
        // PDF, Office 파일은 파일명과 메타데이터만 사용
        contentText = `파일명: ${filename}\n대상: ${targetCategory}`
      }
    } catch (e) {
      console.log('Content extraction failed, using filename only')
      contentText = filename
    }

    // AI로 자동 분류
    let aiCategories = {
      subject_category: '',
      tool_categories: [] as string[],
      method_categories: [] as string[],
      description: '',
      learning_objectives: '',
      difficulty: 'medium' as 'low' | 'medium' | 'high'
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
      
      const prompt = `다음 교육 자료를 분석하여 JSON 형식으로 분류해주세요:

파일명: ${filename}
대상: ${targetCategory}
내용 미리보기: ${contentText.substring(0, 500)}

다음 형식으로 응답해주세요:
{
  "subject_category": "주제 (예: 코딩, 로봇, 과학, 수학, 언어, 예술 등)",
  "tool_categories": ["사용된 도구/교구 배열 (예: 아두이노, 레고, 마이크로비트 등)"],
  "method_categories": ["교수방법 배열 (예: 프로젝트학습, 협동학습, 문제해결학습 등)"],
  "description": "자료에 대한 간단한 설명 (100자 이내)",
  "learning_objectives": "주요 학습 목표 (100자 이내)",
  "difficulty": "난이도 (low/medium/high 중 하나)"
}

**중요: 반드시 위 JSON 형식으로만 응답하고, 다른 설명은 추가하지 마세요.**`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      
      // JSON 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiCategories = JSON.parse(jsonMatch[0])
      }
    } catch (aiError) {
      console.error('AI categorization failed:', aiError)
      // AI 실패 시 기본값 사용
      aiCategories.description = `${filename} 자료`
    }

    // teaching_materials 테이블에 저장
    const { data: material, error: insertError } = await supabase
      .from('teaching_materials')
      .insert({
        user_id: user.id,
        filename: filename,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        title: filename.replace(/\.[^/.]+$/, ''), // 확장자 제거
        description: aiCategories.description,
        content_text: contentText.substring(0, 10000), // 최대 10KB
        target_category: targetCategory,
        subject_category: aiCategories.subject_category || '기타',
        tool_categories: aiCategories.tool_categories || [],
        method_categories: aiCategories.method_categories || [],
        difficulty: aiCategories.difficulty || 'medium',
        learning_objectives: aiCategories.learning_objectives,
        status: 'approved', // 시드 데이터는 자동 승인
        is_seed_data: true, // 시드 데이터 표시
        usage_count: 0,
        download_count: 0,
        bookmark_count: 0,
        rating: 0,
        rating_count: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      // 업로드된 파일 삭제
      await supabase.storage.from('teaching-materials').remove([fileName])
      return NextResponse.json(
        { error: 'Failed to save material data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      materialId: material.id,
      filename: filename,
      categories: aiCategories
    })

  } catch (error) {
    console.error('Seed data upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
