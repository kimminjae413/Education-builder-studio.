// src/lib/parsers/xlsx-parser.ts
// XLSX/XLS (엑셀) 파일에서 텍스트 추출

import * as XLSX from 'xlsx'

export interface XLSXParseResult {
  text: string
  sheetCount: number
  metadata: {
    sheetNames: string[]
    rowCount: number
    columnCount: number
  }
}

/**
 * XLSX/XLS 파일에서 텍스트 추출
 */
export function parseXLSX(buffer: Buffer): XLSXParseResult {
  try {
    // 엑셀 파일 읽기
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    const texts: string[] = []
    const sheetNames = workbook.SheetNames
    let totalRows = 0
    let maxColumns = 0

    // 각 시트에서 텍스트 추출
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) continue

      // 시트 범위 가져오기
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      totalRows += range.e.r - range.s.r + 1
      maxColumns = Math.max(maxColumns, range.e.c - range.s.c + 1)

      // 시트를 텍스트로 변환
      const sheetText = XLSX.utils.sheet_to_txt(worksheet, { strip: true })

      if (sheetText.trim()) {
        texts.push(`[시트: ${sheetName}]\n${sheetText}`)
      }
    }

    return {
      text: texts.join('\n\n'),
      sheetCount: sheetNames.length,
      metadata: {
        sheetNames,
        rowCount: totalRows,
        columnCount: maxColumns,
      },
    }
  } catch (error) {
    console.error('XLSX parsing error:', error)
    throw new Error(`XLSX 파싱 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
