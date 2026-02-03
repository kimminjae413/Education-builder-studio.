// src/app/api/embeddings/generate/route.ts
// 이 API는 Gemini File Search API 자동 인덱싱으로 대체됨
// 폴백용으로 유지

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { getMaterialsForIndexing, markAsIndexed } from '@/lib/db/queries'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const adminCheck = await isAdmin(user.uid)
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    console.log('🔄 Gemini File Search 인덱싱 상태 업데이트 시작...')

    // Gemini File Search API가 자동으로 인덱싱하므로
    // 이 API는 단순히 인덱싱 완료된 자료를 표시하는 용도로 변경

    // 인덱싱 대기 중인 자료 조회
    const materials = await getMaterialsForIndexing(100)

    if (!materials || materials.length === 0) {
      console.log('✅ 모든 자료가 Gemini File Search에 인덱싱되었습니다')
      return NextResponse.json({
        message: 'All materials already indexed in Gemini File Search',
        processed: 0,
      })
    }

    console.log(`📊 ${materials.length}개 자료의 인덱싱 상태 업데이트...`)

    // Gemini File Search API는 GCS 버킷과 동기화되어 자동 인덱싱됨
    // 여기서는 DB의 indexed 플래그만 업데이트
    let successCount = 0
    let errorCount = 0

    for (const material of materials) {
      try {
        // GCS에 파일이 업로드되면 Gemini가 자동 인덱싱
        // 여기서는 플래그만 업데이트
        await markAsIndexed(material.id)
        successCount++
        console.log(`✅ ${material.id} 인덱싱 완료 표시`)
      } catch (error) {
        console.error(`❌ ${material.id} 업데이트 실패:`, error)
        errorCount++
      }
    }

    console.log(`✅ 인덱싱 상태 업데이트 완료: 성공 ${successCount}개, 실패 ${errorCount}개`)

    return NextResponse.json({
      success: true,
      processed: successCount,
      failed: errorCount,
      total: materials.length,
      message: 'Gemini File Search API는 GCS 버킷과 자동 동기화됩니다',
    })
  } catch (error) {
    console.error('❌ Indexing status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
