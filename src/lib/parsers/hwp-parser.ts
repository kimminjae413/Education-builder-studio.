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
    const HWP = await import('hwp.js')

    // HWP 파일 파싱
    const hwpDocument = await HWP.default.parse(buffer)

    // 텍스트 추출
    let text = ''

    if (hwpDocument && hwpDocument.sections) {
      for (const section of hwpDocument.sections) {
        if (section.paragraphs) {
          for (const paragraph of section.paragraphs) {
            if (paragraph.texts) {
              for (const textItem of paragraph.texts) {
                if (typeof textItem === 'string') {
                  text += textItem
                } else if (textItem && textItem.text) {
                  text += textItem.text
                }
              }
              text += '\n'
            }
          }
        }
      }
    }

    // 대체 방법: body.text가 있는 경우
    if (!text.trim() && hwpDocument?.body?.text) {
      text = hwpDocument.body.text
    }

    // 단어 수 계산
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length

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
