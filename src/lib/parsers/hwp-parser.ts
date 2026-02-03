// src/lib/parsers/hwp-parser.ts
// HWP (아래아 한글) 파일에서 텍스트 추출

export interface HWPParseResult {
  text: string
  metadata: {
    wordCount: number
  }
}

/**
 * HWP 파일에서 텍스트 추출
 * hwp.js 라이브러리 사용
 */
export async function parseHWP(buffer: Buffer): Promise<HWPParseResult> {
  try {
    // hwp.js는 동적 import 필요 (ESM 모듈)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const HWP = await import('hwp.js') as any

    // HWP 파일 파싱
    const hwpDocument = await HWP.default.parse(buffer)

    // 텍스트 추출
    let text = ''

    // hwp.js의 구조에 맞게 텍스트 추출 시도
    if (hwpDocument) {
      // body.text가 있는 경우
      if (hwpDocument.body?.text) {
        text = hwpDocument.body.text
      }
      // sections가 있는 경우 재귀적으로 텍스트 추출
      else if (hwpDocument.sections) {
        text = extractTextFromObject(hwpDocument.sections)
      }
      // 전체 객체에서 텍스트 추출 시도
      else {
        text = extractTextFromObject(hwpDocument)
      }
    }

    // 단어 수 계산
    const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length

    return {
      text: text.trim(),
      metadata: {
        wordCount,
      },
    }
  } catch (error) {
    console.error('HWP parsing error:', error)

    // hwp.js 설치 안 된 경우 안내
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      throw new Error('HWP 파서 모듈이 설치되지 않았습니다. npm install hwp.js를 실행하세요.')
    }

    throw new Error(`HWP 파싱 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 객체에서 재귀적으로 텍스트 추출
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextFromObject(obj: any): string {
  if (!obj) return ''

  if (typeof obj === 'string') return obj

  if (Array.isArray(obj)) {
    return obj.map(extractTextFromObject).join(' ')
  }

  if (typeof obj === 'object') {
    let text = ''

    // 일반적인 텍스트 속성들 확인
    if (obj.text) text += obj.text + ' '
    if (obj.content) text += extractTextFromObject(obj.content) + ' '
    if (obj.value) text += obj.value + ' '

    // 나머지 속성들 순회
    for (const key of Object.keys(obj)) {
      if (!['text', 'content', 'value'].includes(key)) {
        const val = obj[key]
        if (typeof val === 'object') {
          text += extractTextFromObject(val) + ' '
        }
      }
    }

    return text
  }

  return ''
}
