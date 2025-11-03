// src/app/api/admin/seed-data/upload/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { extractTextFromFile, cleanTextForAI } from '@/lib/utils/file-parser' // ⭐ 추가

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

    // 파일명에서 메타데이터 추출
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

    // 한글 파일명 처리
    const timestamp = Date.now()
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
    const extension = fileExtension || 'pdf'
    
    const safeBaseName = nameWithoutExt
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .trim()
    
    const finalBaseName = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(safeBaseName) || safeBaseName.length === 0
      ? `material_${timestamp}`
      : `${timestamp}_${safeBaseName}`
    
    const storageFileName = `seed/${finalBaseName}.${extension}`
    
    console.log('Original filename:', filename)
    console.log('Storage filename:', storageFileName)
    
    // Supabase Storage에 업로드
    const fileBuffer = await file.arrayBuffer()
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('teaching-materials')
      .upload(storageFileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `File upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Public URL 생성
    const { data: { publicUrl } } = supabase
      .storage
      .from('teaching-materials')
      .getPublicUrl(storageFileName)

    // ⭐ 파일 내용 텍스트 추출 (개선된 버전)
    let contentText = ''
    let extractionSuccess = false
    
    try {
      console.log(`📂 파일 처리 시작: ${filename}`)
      contentText = await extractTextFromFile(file)
      
      // 추출 성공 여부 판단 (파일명보다 충분히 길면 성공)
      extractionSuccess = contentText.length > filename.length + 50
      
      if (extractionSuccess) {
        contentText = cleanTextForAI(contentText)
        console.log(`✅ 텍스트 추출 성공: ${contentText.length}자`)
      } else {
        console.warn(`⚠️ 텍스트 추출 실패, 파일명만 사용`)
        contentText = `파일명: ${filename}\n대상: ${targetCategory}`
      }
    } catch (e) {
      console.error('텍스트 추출 에러:', e)
      contentText = `파일명: ${filename}\n대상: ${targetCategory}`
      extractionSuccess = false
    }

    // ⭐ AI로 자동 분류 (실제 내용 기반)
    let aiCategories = {
      subject_category: '',
      tool_categories: [] as string[],
      method_categories: [] as string[],
      description: '',
      learning_objectives: '',
      difficulty: 'medium' as 'low' | 'medium' | 'high'
    }

    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3, // 정확성 우선
        }
      })
      
      // ⭐ 프롬프트 개선: 실제 내용 포함
      const prompt = `다음 교육 자료를 분석하여 JSON 형식으로 분류해주세요:

**파일명**: ${filename}
**대상**: ${targetCategory}

${extractionSuccess ? 
  `**실제 문서 내용** (처음 500자):\n${contentText.substring(0, 500)}` : 
  `**문서 내용**: (추출 실패, 파일명 기반으로 분석)`
}

다음 JSON 형식으로 응답해주세요:
{
  "subject_category": "주제 (예: 코딩, 로봇, 메이커, 과학, 수학, AI 등)",
  "tool_categories": ["도구/교구 (예: 아두이노, 마이크로비트, 레고, 3D프린터 등)"],
  "method_categories": ["교수방법 (예: 프로젝트학습, 문제해결학습, 협동학습, 강의, 실습 등)"],
  "description": "${extractionSuccess ? '실제 내용 기반' : '파일명 기반'} 설명 (2-3문장, 100자 이내)",
  "learning_objectives": "${extractionSuccess ? '문서에서 파악한' : '추정되는'} 학습 목표 (100자 이내)",
  "difficulty": "난이도 (low/medium/high)"
}

**중요**: 
${extractionSuccess ? 
  '- 실제 문서 내용을 정확히 분석하세요\n- 문서에 명시된 학습 활동과 목표를 반영하세요' : 
  '- 파일명만으로 추정하여 작성하세요'
}
- 반드시 유효한 JSON만 출력하세요 (코드 블록 사용 금지)`

      console.log('🤖 AI 분석 시작...')
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      
      // JSON 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiCategories = JSON.parse(jsonMatch[0])
        console.log('✅ AI 분석 성공:', aiCategories)
      } else {
        throw new Error('JSON 추출 실패')
      }
    } catch (aiError) {
      console.error('AI 분류 실패:', aiError)
      aiCategories = {
        subject_category: '기타',
        tool_categories: [],
        method_categories: ['강의', '실습'],
        description: extractionSuccess ? contentText.substring(0, 100) : filename,
        learning_objectives: '교육 자료',
        difficulty: 'medium'
      }
    }

    // DB 저장
    const { data: material, error: insertError } = await supabase
      .from('teaching_materials')
      .insert({
        user_id: user.id,
        filename: filename,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        title: filename.replace(/\.[^/.]+$/, ''),
        description: aiCategories.description,
        content_text: contentText.substring(0, 10000), // 최대 10000자 저장
        target_category: targetCategory,
        subject_category: aiCategories.subject_category || '기타',
        tool_categories: aiCategories.tool_categories || [],
        method_categories: aiCategories.method_categories || [],
        difficulty: aiCategories.difficulty || 'medium',
        learning_objectives: aiCategories.learning_objectives,
        status: 'approved',
        is_seed_data: true,
        usage_count: 0,
        download_count: 0,
        bookmark_count: 0,
        rating: 0,
        rating_count: 0,
        extracted_text_length: extractionSuccess ? contentText.length : 0, // ⭐ 추가
        text_extraction_success: extractionSuccess, // ⭐ 추가
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      // 업로드한 파일 삭제
      await supabase.storage.from('teaching-materials').remove([storageFileName])
      return NextResponse.json(
        { error: `Failed to save material data: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ 시드 데이터 업로드 완료: ${filename}`)

    return NextResponse.json({
      success: true,
      materialId: material.id,
      filename: filename,
      storageFileName: storageFileName,
      categories: aiCategories,
      textExtracted: extractionSuccess, // ⭐ 클라이언트에 알림
      textLength: extractionSuccess ? contentText.length : 0, // ⭐ 추가
    })

  } catch (error) {
    console.error('Seed data upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
