// src/lib/rag/retriever.ts
// RAG 검색 엔진 - 유사 청크 검색 및 컨텍스트 구성

import { embedQuery, cosineSimilarity } from './embedder'
import { searchSimilarChunks, DocumentChunk } from '@/lib/db/queries'

export interface RetrievalOptions {
  topK?: number           // 반환할 청크 수 (기본: 10)
  minScore?: number       // 최소 유사도 점수 (기본: 0.5)
  maxTokens?: number      // 최대 토큰 수 (기본: 4000)
  documentIds?: string[]  // 특정 문서만 검색
  categories?: string[]   // 카테고리 필터
}

export interface RetrievalResult {
  chunkId: string
  documentId: string
  documentTitle: string
  content: string
  score: number
  tokenCount: number
  metadata: {
    chunkIndex: number
    category?: string
    author?: string
  }
}

export interface RAGContext {
  results: RetrievalResult[]
  contextText: string
  totalTokens: number
  sources: Array<{
    documentId: string
    documentTitle: string
    chunkCount: number
  }>
}

const DEFAULT_OPTIONS: Required<Omit<RetrievalOptions, 'documentIds' | 'categories'>> = {
  topK: 10,
  minScore: 0.5,
  maxTokens: 4000,
}

/**
 * 쿼리와 유사한 청크 검색
 */
export async function searchSimilar(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 1. 쿼리 임베딩 생성
  console.log('🔍 검색 쿼리 임베딩 생성...')
  const queryEmbedding = await embedQuery(query)

  // 2. 벡터 유사도 검색
  console.log('🔍 유사 청크 검색...')
  const chunks = await searchSimilarChunks(queryEmbedding, {
    topK: opts.topK,
    minScore: opts.minScore,
    documentIds: options.documentIds,
  })

  // 3. 결과 변환
  const results: RetrievalResult[] = chunks.map(chunk => ({
    chunkId: chunk.id,
    documentId: chunk.document_id,
    documentTitle: chunk.document_title || '제목 없음',
    content: chunk.content,
    score: chunk.similarity || 0,
    tokenCount: chunk.token_count,
    metadata: {
      chunkIndex: chunk.chunk_index,
      ...(chunk.metadata as Record<string, unknown>),
    },
  }))

  console.log(`✅ ${results.length}개 청크 검색 완료`)
  return results
}

/**
 * 검색 결과를 RAG 컨텍스트로 구성
 */
export async function buildRAGContext(
  query: string,
  options: RetrievalOptions = {}
): Promise<RAGContext> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 1. 유사 청크 검색
  const results = await searchSimilar(query, options)

  // 2. 토큰 제한에 맞게 청크 선택
  const selectedResults: RetrievalResult[] = []
  let totalTokens = 0

  for (const result of results) {
    if (totalTokens + result.tokenCount <= opts.maxTokens) {
      selectedResults.push(result)
      totalTokens += result.tokenCount
    } else {
      break
    }
  }

  // 3. 컨텍스트 텍스트 구성
  const contextText = formatContextText(selectedResults)

  // 4. 출처 정보 집계
  const sourcesMap = new Map<string, { title: string; count: number }>()
  for (const result of selectedResults) {
    const existing = sourcesMap.get(result.documentId)
    if (existing) {
      existing.count++
    } else {
      sourcesMap.set(result.documentId, {
        title: result.documentTitle,
        count: 1,
      })
    }
  }

  const sources = Array.from(sourcesMap.entries()).map(([documentId, info]) => ({
    documentId,
    documentTitle: info.title,
    chunkCount: info.count,
  }))

  return {
    results: selectedResults,
    contextText,
    totalTokens,
    sources,
  }
}

/**
 * 검색 결과를 프롬프트용 텍스트로 포맷팅
 */
function formatContextText(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return '관련 자료가 없습니다.'
  }

  const sections: string[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const section = `
[참고자료 ${i + 1}] ${result.documentTitle}
---
${result.content}
---
(유사도: ${(result.score * 100).toFixed(1)}%)
`.trim()

    sections.push(section)
  }

  return sections.join('\n\n')
}

/**
 * 재순위 (Reranking) - 선택적 사용
 * LLM을 사용하여 검색 결과의 관련성을 재평가
 */
export async function rerankResults(
  query: string,
  results: RetrievalResult[],
  topK: number = 5
): Promise<RetrievalResult[]> {
  // 간단한 구현: 키워드 매칭 점수 추가
  const queryKeywords = extractKeywords(query)

  const scoredResults = results.map(result => {
    const contentKeywords = extractKeywords(result.content)
    const keywordOverlap = queryKeywords.filter(k =>
      contentKeywords.includes(k)
    ).length

    // 키워드 매칭 가중치 추가 (최대 20% 보너스)
    const keywordBonus = Math.min(keywordOverlap * 0.05, 0.2)
    const adjustedScore = result.score + keywordBonus

    return { ...result, score: adjustedScore }
  })

  // 재정렬
  scoredResults.sort((a, b) => b.score - a.score)

  return scoredResults.slice(0, topK)
}

/**
 * 텍스트에서 키워드 추출
 */
function extractKeywords(text: string): string[] {
  // 한국어/영어 단어 추출
  const words = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1)

  // 불용어 제거 (간단한 목록)
  const stopwords = new Set([
    '이', '그', '저', '것', '수', '등', '및', '또는', '그리고',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  ])

  return words.filter(w => !stopwords.has(w))
}

/**
 * 쿼리 확장 - 동의어/관련어 추가
 */
export function expandQuery(query: string): string {
  // 교육 관련 동의어 매핑
  const synonyms: Record<string, string[]> = {
    '코딩': ['프로그래밍', '코드', '개발', 'coding'],
    '로봇': ['로보틱스', '로봇공학', 'robot'],
    '아두이노': ['arduino', '마이크로컨트롤러'],
    '초등학생': ['초등', '어린이', '아동'],
    '중학생': ['중등', '청소년'],
    '수업': ['강의', '교육', '학습', '레슨'],
    '활동': ['액티비티', '실습', '체험'],
  }

  let expandedQuery = query

  for (const [word, syns] of Object.entries(synonyms)) {
    if (query.includes(word)) {
      expandedQuery += ' ' + syns.join(' ')
    }
  }

  return expandedQuery
}
