// src/lib/parsers/pdf-parser.ts
// PDF 파일에서 텍스트 추출

import pdf from 'pdf-parse'

export interface PDFParseResult {
  text: string
  pageCount: number
  metadata: {
    title?: string
    author?: string
    subject?: string
    creator?: string
  }
}

/**
 * PDF 파일에서 텍스트 추출
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    const data = await pdf(buffer)

    return {
      text: data.text || '',
      pageCount: data.numpages || 0,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
      },
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error(`PDF 파싱 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
