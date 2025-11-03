// src/app/api/admin/seed-data/generate-embeddings/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ⭐ Netlify Functions 타임아웃 설정 (임베딩 생성은 시간 오래 걸림)
export const maxDuration = 60 // 60초
export const dynamic = 'force-dynamic'

export async function POST() {
  const startTime = Date.now()
  
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

    console.log('🚀 임베딩 생성 작업 시작...')

    // 임베딩이 없는 승인된 시드 데이터 가져오기
    const { data: materials, error: fetchError } = await supabase
      .from('teaching_materials')
      .select('id, filename, title, description, subject_category, target_category, content_text, text_extraction_success')
      .eq('is_seed_data', true)
      .eq('status', 'approved')
      .is('embedding', null)
      .limit(50) // ⭐ 100개 → 50개로 축소 (안정성)

    if (fetchError) {
      console.error('❌ 자료 조회 실패:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch materials',
        details: fetchError.message 
      }, { status: 500 })
    }

    if (!materials || materials.length === 0) {
      console.log('✅ 모든 자료의 임베딩이 이미 생성되었습니다!')
      return NextResponse.json({ 
        success: true, 
        message: '모든 자료의 임베딩이 이미 생성되었습니다',
        processed: 0,
        successCount: 0,
        failCount: 0,
        duration: Date.now() - startTime
      })
    }

    console.log(`📊 임베딩 생성 시작: ${materials.length}개 자료`)

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    let successCount = 0
    let failCount = 0
    const errors: Array<{ filename: string; error: string }> = []

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i]
      
      try {
        console.log(`🔄 [${i + 1}/${materials.length}] 처리 중: ${material.filename}`)

        // ⭐ 임베딩할 텍스트 생성 (우선순위: 실제 내용 > 메타데이터)
        let textToEmbed = ''
        
        // 1순위: 실제 추출된 내용
        if (material.text_extraction_success && material.content_text) {
          textToEmbed = `
제목: ${material.title || material.filename}
주제: ${material.subject_category || ''}
대상: ${material.target_category || ''}
설명: ${material.description || ''}

실제 내용:
${material.content_text.substring(0, 2000)}
          `.trim()
        } 
        // 2순위: 메타데이터만
        else {
          textToEmbed = `
파일명: ${material.filename}
제목: ${material.title || material.filename}
주제: ${material.subject_category || ''}
대상: ${material.target_category || ''}
설명: ${material.description || '파일명 기반 추정'}
          `.trim()
        }

        // 너무 짧으면 경고
        if (textToEmbed.length < 20) {
          console.warn(`⚠️ 텍스트가 너무 짧음 (${textToEmbed.length}자): ${material.filename}`)
        }

        // Gemini로 임베딩 생성
        const result = await model.embedContent(textToEmbed)
        const embedding = result.embedding.values

        // 임베딩 검증
        if (!embedding || embedding.length !== 768) {
          throw new Error(`Invalid embedding dimension: ${embedding?.length || 0}`)
        }

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
          errors.push({ 
            filename: material.filename, 
            error: updateError.message 
          })
          failCount++
        } else {
          console.log(`✅ [${i + 1}/${materials.length}] 완료: ${material.filename}`)
          successCount++
        }

        // ⭐ API Rate Limit 방지 (1초 대기)
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error: any) {
        console.error(`❌ 임베딩 생성 실패 (${material.filename}):`, error)
        errors.push({ 
          filename: material.filename, 
          error: error.message || 'Unknown error' 
        })
        failCount++
      }
    }

    const duration = Date.now() - startTime
    console.log(`📊 임베딩 생성 완료: 성공 ${successCount}개, 실패 ${failCount}개 (${Math.round(duration / 1000)}초)`)

    // ⭐ 실패한 자료 목록 출력
    if (errors.length > 0) {
      console.log('❌ 실패 목록:')
      errors.forEach(e => console.log(`  - ${e.filename}: ${e.error}`))
    }

    return NextResponse.json({
      success: true,
      processed: materials.length,
      successCount,
      failCount,
      duration,
      message: `${successCount}개 자료의 임베딩 생성 완료! (${Math.round(duration / 1000)}초)`,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('❌ 임베딩 생성 에러:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        duration
      },
      { status: 500 }
    )
  }
}

// ⭐ GET: 임베딩 생성 상태 확인 (NEW)
export async function GET() {
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

    // 통계 조회
    const { data: stats } = await supabase
      .from('teaching_materials')
      .select('embedding, is_seed_data, status')
      .eq('is_seed_data', true)
      .eq('status', 'approved')

    const total = stats?.length || 0
    const withEmbedding = stats?.filter(s => s.embedding !== null).length || 0
    const withoutEmbedding = total - withEmbedding
    const completionRate = total > 0 ? Math.round((withEmbedding / total) * 100) : 0

    return NextResponse.json({
      total,
      withEmbedding,
      withoutEmbedding,
      completionRate,
      status: withoutEmbedding > 0 ? 'incomplete' : 'complete',
      message: withoutEmbedding > 0 
        ? `${withoutEmbedding}개 자료의 임베딩이 아직 생성되지 않았습니다` 
        : '모든 자료의 임베딩이 생성되었습니다'
    })

  } catch (error: any) {
    console.error('임베딩 상태 조회 에러:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
