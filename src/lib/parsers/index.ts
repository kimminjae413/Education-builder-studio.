// src/lib/parsers/index.ts
// 통합 파일 파서 - 파일 타입에 따라 적절한 파서 호출

import { parsePDF } from './pdf-parser'
import { parseDOCX } from './docx-parser'
import { parsePPTX } from './pptx-parser'
import { parseHWP } from './hwp-parser'
import { parseXLSX } from './xlsx-parser'

export interface ParseResult {
  text: string
  metadata: {
    pageCount?: number
    slideCount?: number
    sheetCount?: number
    wordCount?: number
    title?: string
    author?: string
    sheetNames?: string[]
  }
}

// 지원하는 MIME 타입
const SUPPORTED_MIME_TYPES = {
  // PDF
  'application/pdf': 'pdf',
  // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  // PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  // HWP (아래아 한글)
  'application/x-hwp': 'hwp',
  'application/haansofthwp': 'hwp',
  'application/vnd.hancom.hwp': 'hwp',
} as const

/**
 * 파일 버퍼에서 텍스트 추출
 * @param buffer - 파일 버퍼
 * @param mimeType - MIME 타입
 * @param filename - 파일명 (MIME 타입 감지 실패 시 확장자로 판단)
 */
export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<ParseResult> {
  // MIME 타입에서 파일 유형 결정
  let fileType = SUPPORTED_MIME_TYPES[mimeType as keyof typeof SUPPORTED_MIME_TYPES]

  // MIME 타입으로 판별 실패 시 파일명 확장자로 판별
  if (!fileType && filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        fileType = 'pdf'
        break
      case 'docx':
        fileType = 'docx'
        break
      case 'doc':
        fileType = 'doc'
        break
      case 'pptx':
        fileType = 'pptx'
        break
      case 'ppt':
        fileType = 'ppt'
        break
      case 'xlsx':
        fileType = 'xlsx'
        break
      case 'xls':
        fileType = 'xls'
        break
      case 'hwp':
        fileType = 'hwp'
        break
    }
  }

  if (!fileType) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${mimeType}`)
  }

  console.log(`📄 파일 파싱 시작: ${fileType} (${mimeType})`)

  try {
    switch (fileType) {
      case 'pdf': {
        const result = await parsePDF(buffer)
        return {
          text: result.text,
          metadata: {
            pageCount: result.pageCount,
            title: result.metadata.title,
            author: result.metadata.author,
          },
        }
      }

      case 'docx':
      case 'doc': {
        const result = await parseDOCX(buffer)
        return {
          text: result.text,
          metadata: {
            wordCount: result.metadata.wordCount,
          },
        }
      }

      case 'pptx':
      case 'ppt': {
        const result = await parsePPTX(buffer)
        return {
          text: result.text,
          metadata: {
            slideCount: result.slideCount,
            title: result.metadata.title,
            author: result.metadata.author,
          },
        }
      }

      case 'hwp': {
        const result = await parseHWP(buffer)
        return {
          text: result.text,
          metadata: {
            wordCount: result.metadata.wordCount,
          },
        }
      }

      case 'xlsx':
      case 'xls': {
        const result = parseXLSX(buffer)
        return {
          text: result.text,
          metadata: {
            sheetCount: result.sheetCount,
            sheetNames: result.metadata.sheetNames,
          },
        }
      }

      default:
        throw new Error(`파서가 구현되지 않은 파일 형식: ${fileType}`)
    }
  } catch (error) {
    console.error(`❌ 파일 파싱 실패 (${fileType}):`, error)
    throw error
  }
}

/**
 * 지원하는 파일 형식인지 확인
 */
export function isSupportedFileType(mimeType: string, filename?: string): boolean {
  if (SUPPORTED_MIME_TYPES[mimeType as keyof typeof SUPPORTED_MIME_TYPES]) {
    return true
  }

  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    return ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'hwp'].includes(ext || '')
  }

  return false
}

/**
 * 지원하는 MIME 타입 목록 반환
 */
export function getSupportedMimeTypes(): string[] {
  return Object.keys(SUPPORTED_MIME_TYPES)
}

/**
 * 지원하는 파일 확장자 목록 반환
 */
export function getSupportedExtensions(): string[] {
  return ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'hwp']
}
