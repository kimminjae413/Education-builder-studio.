// src/lib/parsers/docx-parser.ts
// DOCX 파일에서 텍스트 추출

import mammoth from 'mammoth'

export interface DOCXParseResult {
  text: string
  metadata: {
    wordCount: number
  }
}

/**
 * DOCX 파일에서 텍스트 추출
 */
export async function parseDOCX(buffer: Buffer): Promise<DOCXParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value || ''

    // 단어 수 계산
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length

    return {
      text,
      metadata: {
        wordCount,
      },
    }
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error(`DOCX 파싱 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
