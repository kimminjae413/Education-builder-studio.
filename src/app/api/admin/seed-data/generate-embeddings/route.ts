// src/app/api/admin/seed-data/generate-embeddings/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST() {
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

    // 임베딩이 없는 승인된 시드 데이터 가져오기
    const { data: materials, error: fetchError } = await supabase
      .from('teaching_materials')
      .select('id, filename, title, description, subject_category, target_category, content_text')
      .eq('is_seed_data', true)
      .eq('status', 'approved')
      .is('embedding', null)
      .limit(100) // 한 번에 100개씩 처리

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No materials to process. All done!',
        processed: 0 
      })
    }

    console.log(`📊 임베딩 생성 시작: ${materials.length}개`)

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    let successCount = 0
    let failCount = 0

    for (const material of materials) {
      try {
        // 임베딩할 텍스트 생성 (모든 정보 종합)
        const textToEmbed = `
제목: ${material.title || material.filename}
파일명: ${material.filename}
설명: ${material.description || ''}
주제: ${material.subject_category || ''}
대상: ${material.target_category || ''}
내용: ${material.content_text?.substring(0, 1000) || ''}
        `.trim()

        console.log(`🔄 처리 중: ${material.filename}`)

        // Gemini로 임베딩 생성
        const result = await model.embedContent(textToEmbed)
        const embedding = result.embedding.values

        // DB 업데이트
        const { error: updateError } = await supabase
          .from('teaching_materials')
          .update({ 
            embedding: embedding,
            updated_at: new Date().toISOString()
          })
          .eq('id', material.id)

        if (updateError) {
          console.error(`❌ DB 업데이트 실패 (${material.filename}):`, updateError)
          failCount++
        } else {
          console.log(`✅ 임베딩 완료: ${material.filename}`)
          successCount++
        }

        // API Rate Limit 방지 (0.5초 대기)
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`❌ 임베딩 생성 실패 (${material.filename}):`, error)
        failCount++
      }
    }

    console.log(`📊 임베딩 생성 완료: 성공 ${successCount}개, 실패 ${failCount}개`)

    return NextResponse.json({
      success: true,
      processed: materials.length,
      successCount,
      failCount,
      message: `${successCount}개 자료의 임베딩 생성 완료!`
    })

  } catch (error: any) {
    console.error('임베딩 생성 에러:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
