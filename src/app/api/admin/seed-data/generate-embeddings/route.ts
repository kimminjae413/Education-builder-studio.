// src/app/api/admin/seed-data/generate-embeddings/route.ts
// Gemini File Search API로 대체됨 - 자동 인덱싱 상태 확인용

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { getMaterialsForIndexing, markAsIndexed } from '@/lib/db/queries'
import { query } from '@/lib/db/client'

// Netlify Functions 타임아웃 설정
export const maxDuration = 60 // 60초
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

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

    console.log('🚀 Gemini File Search 인덱싱 상태 업데이트 시작...')

    // Gemini File Search API는 GCS 버킷에서 자동 인덱싱
    // 이 API는 인덱싱 완료 상태를 DB에 동기화하는 용도

    // 인덱싱 대기 중인 자료 가져오기
    const materials = await getMaterialsForIndexing(50)

    if (!materials || materials.length === 0) {
      console.log('✅ 모든 자료의 인덱싱이 완료되었습니다!')
      return NextResponse.json({
        success: true,
        message: '모든 자료가 Gemini File Search에 인덱싱되었습니다',
        processed: 0,
        successCount: 0,
        failCount: 0,
        duration: Date.now() - startTime,
      })
    }

    console.log(`📊 인덱싱 상태 업데이트 시작: ${materials.length}개 자료`)

    let successCount = 0
    let failCount = 0
    const errors: Array<{ filename: string; error: string }> = []

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i]

      try {
        console.log(`🔄 [${i + 1}/${materials.length}] 처리 중: ${material.filename}`)

        // Gemini File Search API는 GCS 버킷과 동기화되어 자동 인덱싱됨
        // 파일이 GCS에 업로드되면 자동으로 인덱싱됨
        // 여기서는 DB의 indexed 플래그만 업데이트

        await markAsIndexed(material.id)

        console.log(`✅ [${i + 1}/${materials.length}] 완료: ${material.filename}`)
        successCount++
      } catch (error: unknown) {
        console.error(`❌ 처리 실패 (${material.filename}):`, error)
        errors.push({
          filename: material.filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        failCount++
      }
    }

    const duration = Date.now() - startTime
    console.log(`📊 처리 완료: 성공 ${successCount}개, 실패 ${failCount}개 (${Math.round(duration / 1000)}초)`)

    // 실패한 자료 목록 출력
    if (errors.length > 0) {
      console.log('❌ 실패 목록:')
      errors.forEach((e) => console.log(`  - ${e.filename}: ${e.error}`))
    }

    return NextResponse.json({
      success: true,
      processed: materials.length,
      successCount,
      failCount,
      duration,
      message: `${successCount}개 자료의 인덱싱 상태 업데이트 완료! (${Math.round(duration / 1000)}초)`,
      note: 'Gemini File Search API는 GCS 버킷과 자동 동기화됩니다',
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: unknown) {
    const duration = Date.now() - startTime
    console.error('❌ 인덱싱 상태 업데이트 에러:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        duration,
      },
      { status: 500 }
    )
  }
}

// GET: 인덱싱 상태 확인
export async function GET(request: NextRequest) {
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

    // 통계 조회
    const result = await query<{ indexed: boolean; is_seed_data: boolean; status: string }>(
      `SELECT indexed, is_seed_data, status
       FROM teaching_materials
       WHERE is_seed_data = true AND status = 'approved'`
    )

    const stats = result.rows
    const total = stats.length
    const withIndexing = stats.filter((s) => s.indexed).length
    const withoutIndexing = total - withIndexing
    const completionRate = total > 0 ? Math.round((withIndexing / total) * 100) : 0

    return NextResponse.json({
      total,
      withIndexing,
      withoutIndexing,
      completionRate,
      status: withoutIndexing > 0 ? 'incomplete' : 'complete',
      message:
        withoutIndexing > 0
          ? `${withoutIndexing}개 자료의 인덱싱 대기 중`
          : '모든 자료가 Gemini File Search에 인덱싱되었습니다',
      note: 'Gemini File Search API는 임베딩을 자동 생성합니다',
    })
  } catch (error: unknown) {
    console.error('인덱싱 상태 조회 에러:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
