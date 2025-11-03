// src/lib/utils/file-parser.ts

/**
 * 교육 자료 파일에서 텍스트, 이미지 정보, 표 정보를 추출하는 유틸리티
 * 
 * 지원 형식:
 * - PDF: pdf-parse 라이브러리 사용
 * - DOCX: mammoth 라이브러리 사용
 * - PPTX: jszip + xml2js로 XML 파싱
 */

export interface ParsedContent {
  text: string           // 추출된 전체 텍스트
  imageCount: number     // 이미지 개수
  hasTable: boolean      // 표 포함 여부
  pageCount?: number     // 페이지/슬라이드 수
  summary: string        // 요약본 (AI 분석용, 최대 3000자)
  metadata: {
    hasImages: boolean
    hasTables: boolean
    estimatedReadingTime: number  // 분 단위
  }
}

/**
 * PDF 파일에서 텍스트 추출
 */
export async function parsePDF(buffer: ArrayBuffer): Promise<ParsedContent> {
  try {
    const pdfParse = (await import('pdf-parse')).default
    
    const data = await pdfParse(Buffer.from(buffer))
    
    const text = data.text || ''
    const hasTable = detectTable(text)
    
    return {
      text: text,
      imageCount: 0, // pdf-parse는 이미지 개수 직접 제공 안 함
      hasTable: hasTable,
      pageCount: data.numpages,
      summary: createSummary(text),
      metadata: {
        hasImages: false,
        hasTables: hasTable,
        estimatedReadingTime: Math.ceil(text.length / 1000)
      }
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('PDF 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호화되어 있을 수 있습니다.')
  }
}

/**
 * DOCX 파일에서 텍스트 추출
 */
export async function parseDOCX(buffer: ArrayBuffer): Promise<ParsedContent> {
  try {
    const mammoth = await import('mammoth')
    
    // 텍스트 추출
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    const text = result.value || ''
    
    // 이미지 개수 계산
    const imageCount = result.messages.filter(
      (m: any) => m.type === 'warning' && m.message.includes('image')
    ).length
    
    const hasTable = detectTable(text)
    
    return {
      text: text,
      imageCount: imageCount,
      hasTable: hasTable,
      pageCount: undefined, // DOCX는 페이지 개념 없음 (동적)
      summary: createSummary(text),
      metadata: {
        hasImages: imageCount > 0,
        hasTables: hasTable,
        estimatedReadingTime: Math.ceil(text.length / 1000)
      }
    }
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error('DOCX 파일을 읽을 수 없습니다.')
  }
}

/**
 * PPTX 파일에서 텍스트 추출
 * PPTX는 내부적으로 ZIP 파일이므로 압축 해제 후 XML 파싱
 */
export async function parsePPTX(buffer: ArrayBuffer): Promise<ParsedContent> {
  try {
    const JSZip = (await import('jszip')).default
    const xml2js = await import('xml2js')
    
    const zip = await JSZip.loadAsync(buffer)
    let allText = ''
    let slideCount = 0
    let imageCount = 0
    
    // 1. 모든 슬라이드 XML 파일 찾기
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    )
    
    slideCount = slideFiles.length
    
    // 2. 각 슬라이드에서 텍스트 추출
    for (const slideName of slideFiles) {
      const slideXml = await zip.file(slideName)?.async('text')
      if (!slideXml) continue
      
      try {
        // XML 파싱
        const parsed = await xml2js.parseStringPromise(slideXml)
        
        // 텍스트 추출 (재귀적으로 a:t 태그 찾기)
        const slideText = extractTextFromXml(parsed)
        allText += slideText + '\n\n'
        
        // 이미지 개수 세기 (pic 태그)
        const imageMatches = slideXml.match(/<p:pic/g)
        if (imageMatches) {
          imageCount += imageMatches.length
        }
      } catch (e) {
        console.warn(`Failed to parse slide ${slideName}:`, e)
      }
    }
    
    const hasTable = detectTable(allText)
    
    return {
      text: allText.trim(),
      imageCount: imageCount,
      hasTable: hasTable,
      pageCount: slideCount,
      summary: createSummary(allText),
      metadata: {
        hasImages: imageCount > 0,
        hasTables: hasTable,
        estimatedReadingTime: Math.ceil(allText.length / 1000)
      }
    }
  } catch (error) {
    console.error('PPTX parsing error:', error)
    throw new Error('PPTX 파일을 읽을 수 없습니다.')
  }
}

/**
 * PPT (이전 버전) 파일 처리
 * 이진 포맷이라 파싱이 복잡하므로 기본 정보만 반환
 */
export async function parsePPT(buffer: ArrayBuffer): Promise<ParsedContent> {
  // PPT는 복잡한 이진 포맷이므로 PPTX 변환 권장
  throw new Error('PPT 파일은 지원하지 않습니다. PPTX 형식으로 변환해주세요.')
}

/**
 * DOC (이전 버전) 파일 처리
 */
export async function parseDOC(buffer: ArrayBuffer): Promise<ParsedContent> {
  throw new Error('DOC 파일은 지원하지 않습니다. DOCX 형식으로 변환해주세요.')
}

/**
 * 메인 파서 함수 - 파일 타입에 따라 적절한 파서 선택
 */
export async function parseFile(
  buffer: ArrayBuffer,
  fileType: string
): Promise<ParsedContent> {
  const normalizedType = fileType.toLowerCase()
  
  if (normalizedType.includes('pdf')) {
    return parsePDF(buffer)
  } else if (normalizedType.includes('wordprocessingml') || normalizedType.includes('docx')) {
    return parseDOCX(buffer)
  } else if (normalizedType.includes('presentationml') || normalizedType.includes('pptx')) {
    return parsePPTX(buffer)
  } else if (normalizedType.includes('msword')) {
    return parseDOC(buffer)
  } else if (normalizedType.includes('ms-powerpoint')) {
    return parsePPT(buffer)
  } else {
    throw new Error(`지원하지 않는 파일 형식입니다: ${fileType}`)
  }
}

// ============================================
// 유틸리티 함수들
// ============================================

/**
 * XML 객체에서 재귀적으로 텍스트 추출
 */
function extractTextFromXml(obj: any): string {
  if (!obj) return ''
  
  if (typeof obj === 'string') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(extractTextFromXml).join(' ')
  }
  
  if (typeof obj === 'object') {
    // a:t 태그는 PowerPoint의 텍스트 태그
    if (obj['a:t']) {
      return extractTextFromXml(obj['a:t'])
    }
    
    // 모든 하위 속성 탐색
    let text = ''
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        text += extractTextFromXml(obj[key]) + ' '
      }
    }
    return text
  }
  
  return ''
}

/**
 * 텍스트에서 표(table) 존재 여부 감지
 */
function detectTable(text: string): boolean {
  // 여러 가지 표 패턴 감지
  const patterns = [
    /\|.*\|.*\|/,              // | 구분자
    /\t.*\t/,                   // 탭 구분
    /\s{3,}.*\s{3,}/,          // 연속 공백 (정렬된 컬럼)
    /[-=]{3,}/,                 // 구분선
    /┌|├|└|│/,                 // 박스 문자
  ]
  
  return patterns.some(pattern => pattern.test(text))
}

/**
 * 긴 텍스트에서 요약본 생성 (AI 분석용)
 */
function createSummary(text: string, maxLength: number = 3000): string {
  if (text.length <= maxLength) {
    return text
  }
  
  // 앞부분 2000자 + 뒷부분 1000자
  const start = text.substring(0, 2000)
  const end = text.substring(text.length - 1000)
  
  return start + '\n\n[...중략...]\n\n' + end
}

/**
 * 파일 타입 확인 (MIME type)
 */
export function getFileType(mimeType: string): 'pdf' | 'docx' | 'pptx' | 'doc' | 'ppt' | 'unknown' {
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('wordprocessingml') || mimeType.includes('docx')) return 'docx'
  if (mimeType.includes('presentationml') || mimeType.includes('pptx')) return 'pptx'
  if (mimeType.includes('msword')) return 'doc'
  if (mimeType.includes('ms-powerpoint')) return 'ppt'
  return 'unknown'
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
export function getUserFriendlyError(error: any): string {
  const message = error?.message || ''
  
  if (message.includes('Invalid PDF')) {
    return 'PDF 파일이 손상되었거나 암호화되어 있습니다.'
  }
  if (message.includes('password')) {
    return '암호로 보호된 파일은 지원하지 않습니다.'
  }
  if (message.includes('compressed')) {
    return '압축된 파일입니다. 압축을 풀고 다시 시도해주세요.'
  }
  
  return '파일을 읽을 수 없습니다. 파일 형식을 확인해주세요.'
}
