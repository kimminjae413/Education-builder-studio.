// src/app/api/rag/process/route.ts
// RAG 처리 API - 자료를 청킹/임베딩하여 검색 가능하게 만듦

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdmin } from '@/lib/firebase/server-auth'
import { processForRAG, processMultipleForRAG, processUnprocessedMaterials } from '@/lib/rag/pipeline'

// 단일 자료 처리
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

    const body = await request.json()
    const { materialId, materialIds, processAll, options } = body

    // 전체 미처리 자료 처리
    if (processAll) {
      const limit = body.limit || 10
      const results = await processUnprocessedMaterials(limit, options)

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      return NextResponse.json({
        success: true,
        processed: results.length,
        successCount,
        failCount,
        results,
      })
    }

    // 여러 자료 일괄 처리
    if (materialIds && Array.isArray(materialIds)) {
      const results = await processMultipleForRAG(materialIds, options)

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      return NextResponse.json({
        success: true,
        processed: results.length,
        successCount,
        failCount,
        results,
      })
    }

    // 단일 자료 처리
    if (!materialId) {
      return NextResponse.json(
        { error: 'materialId, materialIds, or processAll required' },
        { status: 400 }
      )
    }

    const result = await processForRAG(materialId, options)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('RAG process error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}

// 처리 상태 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      // 전체 통계 반환
      const { query } = await import('@/lib/db/client')

      const [totalResult, processedResult, pendingResult] = await Promise.all([
        query('SELECT COUNT(*) FROM teaching_materials WHERE status = $1', ['approved']),
        query('SELECT COUNT(*) FROM teaching_materials WHERE chunking_status = $1', ['completed']),
        query('SELECT COUNT(*) FROM teaching_materials WHERE status = $1 AND (chunking_status IS NULL OR chunking_status = $2)', ['approved', 'pending']),
      ])

      return NextResponse.json({
        total: parseInt(totalResult.rows[0]?.count || '0'),
        processed: parseInt(processedResult.rows[0]?.count || '0'),
        pending: parseInt(pendingResult.rows[0]?.count || '0'),
      })
    }

    // 특정 자료 상태 조회
    const { getMaterial, getChunksByDocumentId } = await import('@/lib/db/queries')
    const material = await getMaterial(materialId)

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const chunks = await getChunksByDocumentId(materialId)

    return NextResponse.json({
      materialId,
      title: material.title,
      status: material.chunking_status || 'pending',
      chunkCount: material.chunk_count || chunks.length,
      indexed: material.indexed,
    })
  } catch (error) {
    console.error('RAG status error:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
