// src/app/api/embeddings/generate/route.ts

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

    console.log('🔄 임베딩 생성 작업 시작...')

    // 임베딩이 없는 자료 조회
    const { data: materials, error: fetchError } = await supabase
      .from('teaching_materials')
      .select('id, title, description, content_text, subject_category, target_category, tool_categories')
      .is('embedding', null)
      .eq('status', 'approved')
      .limit(100) // 한 번에 100개씩

    if (fetchError) {
      console.error('❌ 자료 조회 실패:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
    }

    if (!materials || materials.length === 0) {
      console.log('✅ 모든 자료의 임베딩이 이미 생성되었습니다')
      return NextResponse.json({ 
        message: 'All materials already have embeddings',
        processed: 0 
      })
    }

    console.log(`📊 ${materials.length}개 자료의 임베딩 생성 시작...`)

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    let successCount = 0
    let errorCount = 0

    // 각 자료에 대해 임베딩 생성
    for (const material of materials) {
      try {
        // 임베딩할 텍스트 생성 (모든 정보 결합)
        const textToEmbed = [
          material.title,
          material.description,
          material.content_text?.substring(0, 1000), // 최대 1000자
          material.subject_category,
          material.target_category,
          material.tool_categories?.join(' ')
        ].filter(Boolean).join(' ')

        console.log(`🔄 ${material.id}: "${material.title}" 임베딩 생성 중...`)

        // Gemini로 임베딩 생성
        const result = await model.embedContent(textToEmbed)
        const embedding = result.embedding.values

        // DB에 저장
        const { error: updateError } = await supabase
          .from('teaching_materials')
          .update({ embedding: embedding })
          .eq('id', material.id)

        if (updateError) {
          console.error(`❌ ${material.id} 저장 실패:`, updateError)
          errorCount++
        } else {
          console.log(`✅ ${material.id} 완료`)
          successCount++
        }

        // API 속도 제한 방지 (초당 1개)
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ ${material.id} 임베딩 생성 실패:`, error)
        errorCount++
      }
    }

    console.log(`✅ 임베딩 생성 완료: 성공 ${successCount}개, 실패 ${errorCount}개`)

    return NextResponse.json({
      success: true,
      processed: successCount,
      failed: errorCount,
      total: materials.length
    })

  } catch (error) {
    console.error('❌ Embedding generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
