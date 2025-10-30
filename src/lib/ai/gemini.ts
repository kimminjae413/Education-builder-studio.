// src/lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Gemini Pro 모델 가져오기
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-pro' })
}

/**
 * 텍스트 생성 (기본)
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text()
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw new Error('AI 응답 생성 중 오류가 발생했습니다.')
  }
}

/**
 * 구조화된 JSON 응답 생성
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
  try {
    const model = getGeminiModel()
    
    // JSON 형식으로 응답 요청
    const enhancedPrompt = `${prompt}\n\n반드시 유효한 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요.`
    
    const result = await model.generateContent(enhancedPrompt)
    const response = result.response
    const text = response.text()
    
    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('JSON 형식의 응답을 받지 못했습니다.')
    }
    
    return JSON.parse(jsonMatch[0]) as T
  } catch (error) {
    console.error('Gemini JSON Generation Error:', error)
    throw new Error('AI JSON 응답 생성 중 오류가 발생했습니다.')
  }
}

/**
 * 스트리밍 응답 생성
 */
export async function* generateTextStream(prompt: string): AsyncGenerator<string> {
  try {
    const model = getGeminiModel()
    const result = await model.generateContentStream(prompt)
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      yield chunkText
    }
  } catch (error) {
    console.error('Gemini Stream Error:', error)
    throw new Error('AI 스트리밍 중 오류가 발생했습니다.')
  }
}

/**
 * 대화형 채팅 시작
 */
export function startChat(history: Array<{ role: string; parts: string }> = []) {
  const model = getGeminiModel()
  return model.startChat({
    history: history.map(msg => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.parts }],
    })),
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  })
}

/**
 * API 키 유효성 확인
 */
export async function validateGeminiAPI(): Promise<boolean> {
  try {
    const model = getGeminiModel()
    const result = await model.generateContent('Hello')
    return !!result.response.text()
  } catch (error) {
    console.error('Gemini API Validation Error:', error)
    return false
  }
}
