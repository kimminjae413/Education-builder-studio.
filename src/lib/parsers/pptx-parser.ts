// src/lib/parsers/pptx-parser.ts
// PPTX 파일에서 텍스트 추출

import JSZip from 'jszip'
import { parseStringPromise } from 'xml2js'

export interface PPTXParseResult {
  text: string
  slideCount: number
  metadata: {
    title?: string
    author?: string
  }
}

/**
 * PPTX 파일에서 텍스트 추출
 */
export async function parsePPTX(buffer: Buffer): Promise<PPTXParseResult> {
  try {
    const zip = await JSZip.loadAsync(buffer)
    const texts: string[] = []
    let slideCount = 0

    // 슬라이드 파일들 찾기 (slide1.xml, slide2.xml, ...)
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
        return numA - numB
      })

    slideCount = slideFiles.length

    for (const slideFile of slideFiles) {
      const content = await zip.file(slideFile)?.async('text')
      if (content) {
        const parsed = await parseStringPromise(content)
        const slideText = extractTextFromSlide(parsed)
        if (slideText.trim()) {
          texts.push(slideText)
        }
      }
    }

    // 메타데이터 추출
    let title: string | undefined
    let author: string | undefined

    try {
      const coreXml = await zip.file('docProps/core.xml')?.async('text')
      if (coreXml) {
        const coreParsed = await parseStringPromise(coreXml)
        title = coreParsed?.['cp:coreProperties']?.['dc:title']?.[0]
        author = coreParsed?.['cp:coreProperties']?.['dc:creator']?.[0]
      }
    } catch {
      // 메타데이터 추출 실패 무시
    }

    return {
      text: texts.join('\n\n'),
      slideCount,
      metadata: {
        title,
        author,
      },
    }
  } catch (error) {
    console.error('PPTX parsing error:', error)
    throw new Error(`PPTX 파싱 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 슬라이드 XML에서 텍스트 추출
 */
function extractTextFromSlide(slideObj: Record<string, unknown>): string {
  const texts: string[] = []

  function traverse(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return

    if (Array.isArray(obj)) {
      obj.forEach(item => traverse(item))
      return
    }

    const record = obj as Record<string, unknown>

    // a:t 요소에서 텍스트 추출
    if ('a:t' in record) {
      const textContent = record['a:t']
      if (Array.isArray(textContent)) {
        texts.push(...textContent.map(t => String(t)))
      } else if (typeof textContent === 'string') {
        texts.push(textContent)
      }
    }

    // 재귀적으로 모든 프로퍼티 탐색
    Object.values(record).forEach(value => traverse(value))
  }

  traverse(slideObj)
  return texts.join(' ')
}
