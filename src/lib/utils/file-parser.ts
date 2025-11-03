// src/lib/utils/file-parser.ts

import pdf from 'pdf-parse'
import mammoth from 'mammoth'

/**
 * PDF/DOCX 파일에서 텍스트 추출
 * @param file - File 객체
 * @returns 추출된 텍스트 (최대 5000자)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const fileType = file.type
  const filename = file.name
  
  try {
    // PDF 텍스트 추출
    if (fileType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      console.log(`📄 PDF 텍스트 추출 시도: ${filename}`)
      const data = await pdf(Buffer.from(buffer))
      const text = data.text.trim()
      
      if (!text || text.length < 10) {
        console.warn(`⚠️ PDF 텍스트 추출 실패 (너무 짧음): ${filename}`)
        return `파일명: ${filename}`
      }
      
      console.log(`✅ PDF 텍스트 추출 성공: ${text.length}자`)
      return text.length > 5000 ? text.substring(0, 5000) + '...' : text
    }
    
    // DOCX 텍스트 추출
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename.toLowerCase().endsWith('.docx')
    ) {
      console.log(`📝 DOCX 텍스트 추출 시도: ${filename}`)
      const result = await mammoth.extractRawText({ 
        buffer: Buffer.from(buffer) 
      })
      const text = result.value.trim()
      
      if (!text || text.length < 10) {
        console.warn(`⚠️ DOCX 텍스트 추출 실패 (너무 짧음): ${filename}`)
        return `파일명: ${filename}`
      }
      
      console.log(`✅ DOCX 텍스트 추출 성공: ${text.length}자`)
      return text.length > 5000 ? text.substring(0, 5000) + '...' : text
    }
    
    // DOC (구 버전 Word) - mammoth는 지원 안함
    if (fileType === 'application/msword' || filename.toLowerCase().endsWith('.doc')) {
      console.warn(`⚠️ DOC 형식은 텍스트 추출 불가: ${filename}`)
      return `파일명: ${filename}\n(DOC 형식은 내용 분석 불가, DOCX로 변환 권장)`
    }
    
    // PPTX - 현재 미지원
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      filename.toLowerCase().endsWith('.pptx')
    ) {
      console.warn(`⚠️ PPTX 형식은 텍스트 추출 미구현: ${filename}`)
      return `파일명: ${filename}\n(PPT 형식은 현재 파일명만 분석 가능)`
    }
    
    // 기타 파일 형식
    console.warn(`⚠️ 지원하지 않는 파일 형식: ${filename} (${fileType})`)
    return `파일명: ${filename}`
    
  } catch (error) {
    console.error(`❌ 텍스트 추출 에러 (${filename}):`, error)
    return `파일명: ${filename}\n(텍스트 추출 실패)`
  }
}

/**
 * 텍스트를 AI 분석용으로 정제
 * - 연속 공백 제거
 * - 연속 줄바꿈 제거
 * - 특수문자 정리
 */
export function cleanTextForAI(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // 연속 공백 → 단일 공백
    .replace(/\n{3,}/g, '\n\n')     // 3개 이상 줄바꿈 → 2개
    .replace(/[^\S\r\n]{2,}/g, ' ') // 비표준 공백 정리
    .trim()
}
