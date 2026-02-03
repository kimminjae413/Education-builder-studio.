// src/lib/rag/chunker.ts
// 문서 청킹 시스템 - 긴 문서를 의미 단위로 분할

export interface Chunk {
  id: string
  content: string
  metadata: {
    documentId: string
    chunkIndex: number
    startChar: number
    endChar: number
    tokenCount: number
  }
}

export interface ChunkOptions {
  chunkSize?: number      // 청크당 최대 문자 수 (기본: 1000)
  overlap?: number        // 청크 간 중복 문자 수 (기본: 100)
  minChunkSize?: number   // 최소 청크 크기 (기본: 100)
  separator?: string      // 우선 분할 기준 (기본: '\n\n')
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  chunkSize: 1000,
  overlap: 100,
  minChunkSize: 100,
  separator: '\n\n',
}

/**
 * 텍스트를 청크로 분할 (기본 방식)
 * - 문단 단위로 우선 분할
 * - 청크 크기를 초과하면 문장 단위로 분할
 */
export function chunkText(
  text: string,
  documentId: string,
  options: ChunkOptions = {}
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const chunks: Chunk[] = []

  // 텍스트 정규화
  const normalizedText = normalizeText(text)

  if (normalizedText.length === 0) {
    return []
  }

  // 짧은 텍스트는 단일 청크로 반환
  if (normalizedText.length <= opts.chunkSize) {
    return [{
      id: generateChunkId(documentId, 0),
      content: normalizedText,
      metadata: {
        documentId,
        chunkIndex: 0,
        startChar: 0,
        endChar: normalizedText.length,
        tokenCount: estimateTokenCount(normalizedText),
      }
    }]
  }

  // 문단 단위로 분할
  const paragraphs = normalizedText.split(opts.separator).filter(p => p.trim())

  let currentChunk = ''
  let currentStartChar = 0
  let chunkIndex = 0
  let charPosition = 0

  for (const paragraph of paragraphs) {
    const paragraphWithSeparator = paragraph + opts.separator

    // 현재 청크에 문단 추가 가능한지 확인
    if (currentChunk.length + paragraphWithSeparator.length <= opts.chunkSize) {
      currentChunk += paragraphWithSeparator
    } else {
      // 현재 청크 저장 (비어있지 않으면)
      if (currentChunk.trim().length >= opts.minChunkSize) {
        chunks.push({
          id: generateChunkId(documentId, chunkIndex),
          content: currentChunk.trim(),
          metadata: {
            documentId,
            chunkIndex,
            startChar: currentStartChar,
            endChar: currentStartChar + currentChunk.length,
            tokenCount: estimateTokenCount(currentChunk),
          }
        })
        chunkIndex++
      }

      // 오버랩 처리
      if (opts.overlap > 0 && currentChunk.length > opts.overlap) {
        const overlapText = currentChunk.slice(-opts.overlap)
        currentStartChar = charPosition - opts.overlap
        currentChunk = overlapText + paragraphWithSeparator
      } else {
        currentStartChar = charPosition
        currentChunk = paragraphWithSeparator
      }
    }

    charPosition += paragraphWithSeparator.length
  }

  // 마지막 청크 저장
  if (currentChunk.trim().length >= opts.minChunkSize) {
    chunks.push({
      id: generateChunkId(documentId, chunkIndex),
      content: currentChunk.trim(),
      metadata: {
        documentId,
        chunkIndex,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
        tokenCount: estimateTokenCount(currentChunk),
      }
    })
  }

  // 큰 문단이 있어 청크가 없는 경우, 문장 단위로 재분할
  if (chunks.length === 0) {
    return chunkBySentence(normalizedText, documentId, opts)
  }

  return chunks
}

/**
 * 문장 단위로 청킹
 * - 문단 단위 분할이 불가능할 때 사용
 */
export function chunkBySentence(
  text: string,
  documentId: string,
  options: ChunkOptions = {}
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const chunks: Chunk[] = []

  // 한국어/영어 문장 구분자
  const sentencePattern = /(?<=[.!?。！？])\s+/g
  const sentences = text.split(sentencePattern).filter(s => s.trim())

  let currentChunk = ''
  let currentStartChar = 0
  let chunkIndex = 0
  let charPosition = 0

  for (const sentence of sentences) {
    const sentenceWithSpace = sentence + ' '

    if (currentChunk.length + sentenceWithSpace.length <= opts.chunkSize) {
      currentChunk += sentenceWithSpace
    } else {
      // 현재 청크 저장
      if (currentChunk.trim().length >= opts.minChunkSize) {
        chunks.push({
          id: generateChunkId(documentId, chunkIndex),
          content: currentChunk.trim(),
          metadata: {
            documentId,
            chunkIndex,
            startChar: currentStartChar,
            endChar: currentStartChar + currentChunk.length,
            tokenCount: estimateTokenCount(currentChunk),
          }
        })
        chunkIndex++
      }

      // 오버랩 적용
      if (opts.overlap > 0 && currentChunk.length > opts.overlap) {
        currentStartChar = charPosition - opts.overlap
        currentChunk = currentChunk.slice(-opts.overlap) + sentenceWithSpace
      } else {
        currentStartChar = charPosition
        currentChunk = sentenceWithSpace
      }
    }

    charPosition += sentenceWithSpace.length
  }

  // 마지막 청크
  if (currentChunk.trim().length >= opts.minChunkSize) {
    chunks.push({
      id: generateChunkId(documentId, chunkIndex),
      content: currentChunk.trim(),
      metadata: {
        documentId,
        chunkIndex,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
        tokenCount: estimateTokenCount(currentChunk),
      }
    })
  }

  // 그래도 청크가 없으면 강제 분할
  if (chunks.length === 0) {
    return chunkByFixedSize(text, documentId, opts)
  }

  return chunks
}

/**
 * 고정 크기로 강제 분할
 * - 마지막 수단으로 사용
 */
export function chunkByFixedSize(
  text: string,
  documentId: string,
  options: ChunkOptions = {}
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const chunks: Chunk[] = []

  let chunkIndex = 0
  let position = 0

  while (position < text.length) {
    const endPosition = Math.min(position + opts.chunkSize, text.length)
    const chunkContent = text.slice(position, endPosition)

    chunks.push({
      id: generateChunkId(documentId, chunkIndex),
      content: chunkContent.trim(),
      metadata: {
        documentId,
        chunkIndex,
        startChar: position,
        endChar: endPosition,
        tokenCount: estimateTokenCount(chunkContent),
      }
    })

    // 오버랩 적용
    position = endPosition - opts.overlap
    if (position <= chunks[chunks.length - 1].metadata.startChar) {
      position = endPosition // 무한 루프 방지
    }
    chunkIndex++
  }

  return chunks
}

/**
 * 섹션/제목 기준으로 분할
 * - 마크다운 헤더 또는 번호 매기기 기준
 */
export function chunkBySection(
  text: string,
  documentId: string,
  options: ChunkOptions = {}
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 섹션 패턴: 마크다운 헤더, 번호 매기기, 한글 번호 등
  const sectionPattern = /(?=^#{1,6}\s|^\d+\.\s|^[가-힣]\.\s|^[①-⑳]\s)/gm
  const sections = text.split(sectionPattern).filter(s => s.trim())

  if (sections.length <= 1) {
    // 섹션 구분이 안 되면 기본 청킹 사용
    return chunkText(text, documentId, options)
  }

  const chunks: Chunk[] = []
  let chunkIndex = 0
  let charPosition = 0

  for (const section of sections) {
    // 섹션이 청크 크기보다 크면 추가 분할
    if (section.length > opts.chunkSize) {
      const subChunks = chunkText(section, documentId, {
        ...opts,
        // 서브청킹 시 인덱스 오프셋
      })

      for (const subChunk of subChunks) {
        chunks.push({
          ...subChunk,
          id: generateChunkId(documentId, chunkIndex),
          metadata: {
            ...subChunk.metadata,
            chunkIndex,
            startChar: charPosition + subChunk.metadata.startChar,
            endChar: charPosition + subChunk.metadata.endChar,
          }
        })
        chunkIndex++
      }
    } else if (section.trim().length >= opts.minChunkSize) {
      chunks.push({
        id: generateChunkId(documentId, chunkIndex),
        content: section.trim(),
        metadata: {
          documentId,
          chunkIndex,
          startChar: charPosition,
          endChar: charPosition + section.length,
          tokenCount: estimateTokenCount(section),
        }
      })
      chunkIndex++
    }

    charPosition += section.length
  }

  return chunks
}

// ============================================
// 유틸리티 함수들
// ============================================

/**
 * 청크 ID 생성
 */
function generateChunkId(documentId: string, chunkIndex: number): string {
  return `${documentId}_chunk_${chunkIndex.toString().padStart(4, '0')}`
}

/**
 * 토큰 수 추정 (대략적)
 * - 영어: 단어 수 * 1.3
 * - 한국어: 문자 수 / 2
 */
function estimateTokenCount(text: string): number {
  // 한국어 문자 비율 확인
  const koreanChars = (text.match(/[가-힣]/g) || []).length
  const totalChars = text.length
  const koreanRatio = koreanChars / totalChars

  if (koreanRatio > 0.3) {
    // 한국어 위주 텍스트
    return Math.ceil(text.length / 2)
  } else {
    // 영어 위주 텍스트
    const words = text.split(/\s+/).length
    return Math.ceil(words * 1.3)
  }
}

/**
 * 텍스트 정규화
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')           // 윈도우 줄바꿈 통일
    .replace(/\r/g, '\n')             // 맥 구버전 줄바꿈 통일
    .replace(/\n{3,}/g, '\n\n')       // 연속 줄바꿈 정리
    .replace(/[ \t]+/g, ' ')          // 연속 공백 정리
    .trim()
}

/**
 * 청킹 결과 요약 정보
 */
export function getChunkingSummary(chunks: Chunk[]): {
  totalChunks: number
  totalTokens: number
  avgChunkSize: number
  minChunkSize: number
  maxChunkSize: number
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      totalTokens: 0,
      avgChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
    }
  }

  const sizes = chunks.map(c => c.content.length)
  const tokens = chunks.map(c => c.metadata.tokenCount)

  return {
    totalChunks: chunks.length,
    totalTokens: tokens.reduce((a, b) => a + b, 0),
    avgChunkSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
  }
}
