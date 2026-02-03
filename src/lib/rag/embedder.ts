// src/lib/rag/embedder.ts
// Gemini 임베딩 생성 시스템

import { GoogleGenerativeAI } from '@google/generative-ai'
import { Chunk } from './chunker'

// Gemini 임베딩 모델 설정
const EMBEDDING_MODEL = 'text-embedding-004'
const EMBEDDING_DIMENSION = 768
const BATCH_SIZE = 100  // API 배치 처리 크기
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

export interface EmbeddedChunk extends Chunk {
  embedding: number[]
}

export interface EmbeddingResult {
  chunks: EmbeddedChunk[]
  totalTokens: number
  processingTimeMs: number
}

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * 단일 텍스트 임베딩 생성
 */
export async function embedText(text: string): Promise<number[]> {
  const ai = getGenAI()
  const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL })

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await model.embedContent(text)
      return result.embedding.values
    } catch (error: any) {
      lastError = error
      console.error(`Embedding attempt ${attempt + 1} failed:`, error.message)

      // Rate limit 에러인 경우 대기 후 재시도
      if (error.message?.includes('rate') || error.message?.includes('quota')) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
      } else {
        throw error
      }
    }
  }

  throw lastError || new Error('Embedding failed after retries')
}

/**
 * 검색 쿼리 임베딩 생성
 * - 검색용으로 최적화
 */
export async function embedQuery(query: string): Promise<number[]> {
  // 쿼리 임베딩은 기본 embedText 사용
  return embedText(query)
}

/**
 * 문서 청크 임베딩 생성
 * - 문서 저장용으로 최적화
 */
export async function embedDocument(text: string): Promise<number[]> {
  // 문서 임베딩은 기본 embedText 사용
  return embedText(text)
}

/**
 * 여러 청크에 대한 임베딩 일괄 생성
 */
export async function embedChunks(
  chunks: Chunk[],
  onProgress?: (processed: number, total: number) => void
): Promise<EmbeddingResult> {
  const startTime = Date.now()
  const embeddedChunks: EmbeddedChunk[] = []
  let totalTokens = 0

  // 배치 처리
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)

    // 배치 내 병렬 처리
    const batchResults = await Promise.all(
      batch.map(async (chunk) => {
        try {
          const embedding = await embedDocument(chunk.content)
          return {
            ...chunk,
            embedding,
          } as EmbeddedChunk
        } catch (error) {
          console.error(`Failed to embed chunk ${chunk.id}:`, error)
          // 실패한 청크는 빈 임베딩으로 처리
          return {
            ...chunk,
            embedding: new Array(EMBEDDING_DIMENSION).fill(0),
          } as EmbeddedChunk
        }
      })
    )

    embeddedChunks.push(...batchResults)
    totalTokens += batch.reduce((sum, c) => sum + c.metadata.tokenCount, 0)

    // 진행 상황 콜백
    if (onProgress) {
      onProgress(embeddedChunks.length, chunks.length)
    }

    // Rate limit 방지를 위한 딜레이
    if (i + BATCH_SIZE < chunks.length) {
      await delay(100)
    }
  }

  return {
    chunks: embeddedChunks,
    totalTokens,
    processingTimeMs: Date.now() - startTime,
  }
}

/**
 * 코사인 유사도 계산
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  if (magnitude === 0) return 0

  return dotProduct / magnitude
}

/**
 * 임베딩 벡터를 PostgreSQL VECTOR 형식으로 변환
 */
export function toPostgresVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

/**
 * PostgreSQL VECTOR 형식을 배열로 변환
 */
export function fromPostgresVector(vectorStr: string): number[] {
  // "[0.1,0.2,0.3]" 형식에서 배열 추출
  const cleaned = vectorStr.replace(/^\[|\]$/g, '')
  return cleaned.split(',').map(Number)
}

/**
 * 임베딩 차원 확인
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION
}

// 유틸리티: 딜레이 함수
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
