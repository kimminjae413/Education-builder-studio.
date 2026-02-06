// src/app/api/admin/seed-data/upload/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { createMaterial } from '@/lib/db/queries'
import { uploadFile, deleteFile } from '@/lib/storage/gcs'
import { parseFile, getUserFriendlyError } from '@/lib/utils/file-parser'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminCheck = await isAdmin(user.uid)
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`📄 파일 업로드 시작: ${file.name} (${file.type})`)

    // 파일 검증
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // HWP (한글 문서)
      'application/haansofthwp',
      'application/x-hwp',
      'application/hwp',
      // Excel
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    // 파일 확장자로도 검증 (MIME type이 정확하지 않을 수 있음)
    const extension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'xls', 'xlsx']

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type} (${extension})` },
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

    // 파일 내용 파싱
    console.log('📖 파일 내용 추출 시작...')
    let parsedContent
    try {
      const fileBuffer = await file.arrayBuffer()
      // MIME type이 부정확할 수 있으므로 확장자도 함께 전달
      const fileTypeForParsing = file.type || extension || ''
      parsedContent = await parseFile(fileBuffer, fileTypeForParsing)

      console.log('✅ 파일 파싱 완료:', {
        textLength: parsedContent.text.length,
        imageCount: parsedContent.imageCount,
        hasTable: parsedContent.hasTable,
        pageCount: parsedContent.pageCount,
      })
    } catch (parseError: unknown) {
      console.error('❌ 파일 파싱 실패:', parseError)
      return NextResponse.json(
        { error: getUserFriendlyError(parseError) },
        { status: 400 }
      )
    }

    // GCS에 업로드
    console.log('☁️ GCS 업로드 시작...')
    const fileBuffer = await file.arrayBuffer()
    const gcsPath = `seed/${Date.now()}_${filename}`

    let fileUrl: string
    try {
      fileUrl = await uploadFile(fileBuffer, gcsPath, file.type, {
        originalName: filename,
        uploadedBy: user.uid,
        isSeedData: 'true',
      })
    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return NextResponse.json(
        { error: 'File upload failed' },
        { status: 500 }
      )
    }

    console.log('✅ GCS 업로드 완료')

    // AI 분석 - 실제 내용 기반
    console.log('🤖 AI 분석 시작...')
    let aiCategories = {
      subject_category: '',
      tool_categories: [] as string[],
      method_categories: [] as string[],
      description: '',
      learning_objectives: '',
      difficulty: 'medium' as 'low' | 'medium' | 'high',
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const prompt = `다음 교육 자료를 분석하여 JSON 형식으로 분류해주세요:

파일명: ${filename}
대상 학년: ${targetCategory}
페이지/슬라이드 수: ${parsedContent.pageCount || '알 수 없음'}
이미지 수: ${parsedContent.imageCount}개
표 포함: ${parsedContent.hasTable ? '있음' : '없음'}

실제 내용:
${parsedContent.summary}

다음 형식으로 응답해주세요:
{
  "subject_category": "주제 (예: 코딩, 로봇, 과학, 수학, 언어, 예술, 메이커, AI 등)",
  "tool_categories": ["사용된 도구/교구 배열 (예: 아두이노, 레고, 마이크로비트, 스크래치, 엔트리, 3D프린터 등)"],
  "method_categories": ["교수방법 배열 (예: 프로젝트학습, 협동학습, 문제해결학습, 탐구학습, 토론학습 등)"],
  "description": "자료에 대한 간단한 설명 (실제 내용 기반, 100자 이내)",
  "learning_objectives": "주요 학습 목표 (실제 내용 기반, 100자 이내)",
  "difficulty": "난이도 (low/medium/high 중 하나)"
}

**중요**:
1. 실제 내용을 바탕으로 정확하게 분류하세요
2. 반드시 위 JSON 형식으로만 응답하고, 다른 설명은 추가하지 마세요
3. description과 learning_objectives는 실제 내용에서 추출하세요`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      console.log('🤖 AI 응답:', responseText.substring(0, 200))

      // JSON 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiCategories = JSON.parse(jsonMatch[0])
        console.log('✅ AI 분석 완료:', aiCategories)
      }
    } catch (aiError) {
      console.error('❌ AI categorization failed:', aiError)
      // AI 실패 시 기본값 사용
      aiCategories.description = `${filename}의 교육 자료`
      aiCategories.learning_objectives = `${targetCategory} 대상 학습`
    }

    // teaching_materials 테이블에 저장
    console.log('💾 DB 저장 시작...')

    let material
    try {
      material = await createMaterial({
        user_id: user.uid,
        filename: filename,
        file_url: fileUrl,
        gcs_path: gcsPath,
        file_size: file.size,
        file_type: file.type,
        title: filename.replace(/\.[^/.]+$/, ''), // 확장자 제거
        description: aiCategories.description,
        content_text: parsedContent.summary,
        target_category: targetCategory,
        subject_category: aiCategories.subject_category || '기타',
        tool_categories: aiCategories.tool_categories || [],
        method_categories: aiCategories.method_categories || [],
        difficulty: aiCategories.difficulty || 'medium',
        learning_objectives: aiCategories.learning_objectives,
        status: 'approved', // 시드 데이터는 자동 승인
        is_seed_data: true,
        indexed: false, // Gemini File Search 인덱싱 대기
        metadata: {
          pageCount: parsedContent.pageCount,
          imageCount: parsedContent.imageCount,
          hasTable: parsedContent.hasTable,
          estimatedReadingTime: parsedContent.metadata.estimatedReadingTime,
        },
      })
    } catch (insertError) {
      console.error('❌ Insert error:', insertError)
      // 업로드된 파일 삭제
      await deleteFile(gcsPath)
      return NextResponse.json(
        { error: 'Failed to save material data' },
        { status: 500 }
      )
    }

    console.log('✅ DB 저장 완료')

    return NextResponse.json({
      success: true,
      materialId: material.id,
      filename: filename,
      categories: aiCategories,
      parsed: {
        textLength: parsedContent.text.length,
        imageCount: parsedContent.imageCount,
        hasTable: parsedContent.hasTable,
        pageCount: parsedContent.pageCount,
      },
    })
  } catch (error) {
    console.error('❌ Seed data upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
