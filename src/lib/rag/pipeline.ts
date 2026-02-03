// src/lib/rag/pipeline.ts
// RAG 처리 파이프라인 - 업로드된 자료를 청킹/임베딩하여 검색 가능하게 만듦

import { getMaterial, updateMaterial, updateMaterialChunkingStatus, createChunksBatch, deleteChunksByDocumentId } from '@/lib/db/queries'
import { downloadFile } from '@/lib/storage/gcs'
import { parseFile } from '@/lib/utils/file-parser'
import { chunkText, getChunkingSummary } from './chunker'
import { embedChunks, EmbeddedChunk } from './embedder'

export interface RAGProcessingResult {
  success: boolean
  materialId: string
  chunkCount: number
  totalTokens: number
  processingTimeMs: number
  error?: string
}

export interface RAGProcessingOptions {
  chunkSize?: number      // 청크 크기 (기본: 1000)
  overlap?: number        // 청크 오버랩 (기본: 100)
  forceReprocess?: boolean // 이미 처리된 자료도 재처리
}

const DEFAULT_OPTIONS: Required<RAGProcessingOptions> = {
  chunkSize: 1000,
  overlap: 100,
  forceReprocess: false,
}

/**
 * 자료를 RAG 파이프라인으로 처리
 * 1. 파일 다운로드
 * 2. 텍스트 추출
 * 3. 청킹
 * 4. 임베딩 생성
 * 5. document_chunks 테이블에 저장
 */
export async function processForRAG(
  materialId: string,
  options: RAGProcessingOptions = {}
): Promise<RAGProcessingResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()

  console.log(`🚀 RAG 처리 시작: ${materialId}`)

  try {
    // 1. 자료 정보 조회
    const material = await getMaterial(materialId)
    if (!material) {
      throw new Error(`자료를 찾을 수 없습니다: ${materialId}`)
    }

    // 이미 처리된 자료인지 확인
    if (material.chunking_status === 'completed' && !opts.forceReprocess) {
      console.log('⚠️ 이미 처리된 자료입니다. forceReprocess 옵션으로 재처리 가능')
      return {
        success: true,
        materialId,
        chunkCount: material.chunk_count || 0,
        totalTokens: 0,
        processingTimeMs: Date.now() - startTime,
      }
    }

    // 처리 상태 업데이트
    await updateMaterialChunkingStatus(materialId, 'processing')

    // 2. 파일 다운로드
    console.log('📥 파일 다운로드 중...')
    if (!material.gcs_path) {
      throw new Error('GCS 경로가 없습니다')
    }

    const fileBuffer = await downloadFile(material.gcs_path)
    console.log(`✅ 파일 다운로드 완료: ${fileBuffer.byteLength} bytes`)

    // 3. 텍스트 추출
    console.log('📖 텍스트 추출 중...')
    // Buffer를 ArrayBuffer로 변환
    const arrayBuffer = new Uint8Array(fileBuffer).buffer as ArrayBuffer
    const parsed = await parseFile(arrayBuffer, material.file_type)
    const text = parsed.text

    if (!text || text.trim().length === 0) {
      throw new Error('텍스트를 추출할 수 없습니다')
    }
    console.log(`✅ 텍스트 추출 완료: ${text.length} 문자`)

    // content_text 저장 (아직 없는 경우)
    if (!material.content_text) {
      await updateMaterial(materialId, {
        content_text: text.substring(0, 10000), // 최대 10000자
      })
    }

    // 4. 청킹
    console.log('✂️ 청킹 중...')
    const chunks = chunkText(text, materialId, {
      chunkSize: opts.chunkSize,
      overlap: opts.overlap,
    })

    const summary = getChunkingSummary(chunks)
    console.log(`✅ 청킹 완료:`, summary)

    if (chunks.length === 0) {
      throw new Error('청크가 생성되지 않았습니다')
    }

    // 5. 임베딩 생성
    console.log('🧠 임베딩 생성 중...')
    const embeddingResult = await embedChunks(chunks, (processed, total) => {
      console.log(`📊 임베딩 진행: ${processed}/${total}`)
    })
    console.log(`✅ 임베딩 생성 완료: ${embeddingResult.processingTimeMs}ms`)

    // 6. 기존 청크 삭제 (재처리인 경우)
    if (opts.forceReprocess) {
      await deleteChunksByDocumentId(materialId)
    }

    // 7. 청크 저장 (배치)
    console.log('💾 청크 저장 중...')
    const chunksToSave = embeddingResult.chunks.map((chunk: EmbeddedChunk) => ({
      document_id: materialId,
      chunk_index: chunk.metadata.chunkIndex,
      content: chunk.content,
      token_count: chunk.metadata.tokenCount,
      embedding: chunk.embedding,
      metadata: {
        startChar: chunk.metadata.startChar,
        endChar: chunk.metadata.endChar,
      },
    }))

    const savedCount = await createChunksBatch(chunksToSave)
    console.log(`✅ 청크 저장 완료: ${savedCount}개`)

    // 8. 처리 상태 업데이트
    await updateMaterialChunkingStatus(materialId, 'completed', chunks.length)
    await updateMaterial(materialId, {
      indexed: true,
    })

    const processingTimeMs = Date.now() - startTime
    console.log(`🎉 RAG 처리 완료: ${processingTimeMs}ms`)

    return {
      success: true,
      materialId,
      chunkCount: chunks.length,
      totalTokens: embeddingResult.totalTokens,
      processingTimeMs,
    }
  } catch (error) {
    console.error('❌ RAG 처리 실패:', error)

    // 실패 상태 업데이트
    await updateMaterialChunkingStatus(materialId, 'failed')

    return {
      success: false,
      materialId,
      chunkCount: 0,
      totalTokens: 0,
      processingTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 여러 자료를 일괄 처리
 */
export async function processMultipleForRAG(
  materialIds: string[],
  options: RAGProcessingOptions = {}
): Promise<RAGProcessingResult[]> {
  const results: RAGProcessingResult[] = []

  for (const materialId of materialIds) {
    const result = await processForRAG(materialId, options)
    results.push(result)

    // API 부하 방지를 위한 딜레이
    await delay(1000)
  }

  return results
}

/**
 * 처리되지 않은 자료 처리
 */
export async function processUnprocessedMaterials(
  limit: number = 10,
  options: RAGProcessingOptions = {}
): Promise<RAGProcessingResult[]> {
  // TODO: getMaterialsForProcessing 함수 필요
  // 현재는 getMaterialsForIndexing 사용
  const { getMaterialsForIndexing } = await import('@/lib/db/queries')
  const materials = await getMaterialsForIndexing(limit)

  const results: RAGProcessingResult[] = []

  for (const material of materials) {
    const result = await processForRAG(material.id, options)
    results.push(result)

    // API 부하 방지
    await delay(1000)
  }

  return results
}

// 유틸리티: 딜레이 함수
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
