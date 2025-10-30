// src/app/api/admin/seed-data/upload/route.ts (개선 버전)
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, GoogleAIFileManager } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인 (동일)
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

    const filename = file.name
    const fileExtension = filename.split('.').pop()?.toLowerCase()
    
    // 학년 추출 (기존 로직 유지)
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

    // ===== 🔥 핵심 개선: 한글 파일명 처리 =====
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

    // ===== 🔥 핵심 개선: Gemini File API로 PDF/이미지 분석 =====
    let aiCategories = {
      subject_category: '',
      tool_categories: [] as string[],
      method_categories: [] as string[],
      description: '',
      learning_objectives: '',
      difficulty: 'medium' as 'low' | 'medium' | 'high',
      contentSummary: '' // 내용 요약 추가
    }

    try {
      // 1. 파일을 Gemini에 임시 업로드 (분석용)
      const tempFilePath = `/tmp/${timestamp}_${filename}`
      const fs = await import('fs/promises')
      await fs.writeFile(tempFilePath, Buffer.from(fileBuffer))
      
      const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: file.type,
        displayName: filename,
      })
      
      console.log(`Uploaded to Gemini: ${uploadResult.file.uri}`)

      // 2. Gemini로 파일 내용 분석 (텍스트, 도표, 그림 모두 포함!)
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp'  // 또는 'gemini-1.5-pro'
      })
      
      const prompt = `다음 교육 자료를 **깊이 있게 분석**하여 JSON 형식으로 분류해주세요.
파일에 포함된 **텍스트, 도표, 그림, 차트, 코드 예제** 등 모든 내용을 꼼꼼히 살펴보세요.

파일명: ${filename}
대상 학년: ${targetCategory}

다음 형식으로 응답해주세요:
{
  "subject_category": "주제 (예: 코딩, 로봇, 과학, 수학, 언어, 예술 등)",
  "tool_categories": ["사용된 도구/교구 배열 (예: 아두이노, 레고, 마이크로비트, Scratch 등)"],
  "method_categories": ["교수방법 배열 (예: 프로젝트학습, 협동학습, 문제해결학습 등)"],
  "description": "자료에 대한 간단한 설명 (100자 이내)",
  "learning_objectives": "주요 학습 목표 (100자 이내)",
  "difficulty": "난이도 (low/medium/high 중 하나)",
  "contentSummary": "파일 내용의 핵심 요약 (200자 이내, 도표/그림 포함)"
}

**중요:**
- 파일 내의 도표, 그림, 차트를 분석하여 구체적인 교구나 활동을 파악하세요.
- 슬라이드 제목, 본문, 이미지 설명 등을 종합하여 정확한 주제를 도출하세요.
- 반드시 위 JSON 형식으로만 응답하고, 다른 설명은 추가하지 마세요.`

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri
          }
        },
        { text: prompt }
      ])
      
      const responseText = result.response.text()
      console.log('Gemini analysis:', responseText)
      
      // JSON 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiCategories = { ...aiCategories, ...JSON.parse(jsonMatch[0]) }
      }

      // 3. 임시 파일 삭제
      await fs.unlink(tempFilePath)
      
      // 4. Gemini 임시 파일도 삭제 (선택)
      // await fileManager.deleteFile(uploadResult.file.name)

    } catch (aiError) {
      console.error('AI categorization failed:', aiError)
      // AI 실패 시 기본값 사용
      aiCategories.description = `${filename} 자료`
      aiCategories.contentSummary = '자동 분석 실패 - 수동 확인 필요'
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
        content_text: aiCategories.contentSummary, // 요약 저장
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
        rating_count: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      await supabase.storage.from('teaching-materials').remove([storageFileName])
      return NextResponse.json(
        { error: `Failed to save material data: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      materialId: material.id,
      filename: filename,
      storageFileName: storageFileName,
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
