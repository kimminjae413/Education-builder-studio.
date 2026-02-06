// src/lib/gemini/rag.ts
// Gemini File Search 기반 RAG 시스템

import { GoogleGenerativeAI } from '@google/generative-ai'
import { UploadedFile, createFileReferences } from './files'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface RAGSource {
  title: string
  uri: string
  fileId?: string
}

export interface RAGResponse {
  text: string
  sources: RAGSource[]
  modelUsed: string
}

// 파일 기반 RAG 검색 및 답변 생성
export async function generateWithFileSearch(
  prompt: string,
  files: UploadedFile[],
  systemInstruction?: string
): Promise<RAGResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    },
  })

  const defaultInstruction = `당신은 교육과정 설계 전문가입니다.
제공된 파일들을 참고하여 답변을 생성하세요.
파일에서 관련 정보를 찾아 정확한 답변을 제공하세요.
답변에 포함된 정보의 출처(파일명)를 명시하세요.`

  const fileRefs = createFileReferences(files)

  const result = await model.generateContent([
    systemInstruction || defaultInstruction,
    ...fileRefs,
    prompt,
  ])

  const responseText = result.response.text()

  return {
    text: responseText,
    sources: files.map(f => ({
      title: f.displayName,
      uri: f.uri,
      fileId: f.name,
    })),
    modelUsed: 'gemini-2.0-flash',
  }
}

// 교육 과정 생성 (File Search 기반 RAG)
export async function generateCourseWithFileSearch(
  courseRequest: {
    targetAudience: string
    subject: string
    tools: string[]
    duration: number
    sessionCount: number
    knowledgeGoals: string[]
    skillGoals: string[]
    attitudeGoals: string[]
    lectureRatio: number
    practiceRatio: number
    projectRatio: number
  },
  files: UploadedFile[]
): Promise<{
  courseData: unknown
  sources: RAGSource[]
  generationTime: number
}> {
  const startTime = Date.now()

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  })

  const fileRefs = createFileReferences(files)

  const prompt = `당신은 교육과정 설계 전문가입니다.

대상: ${courseRequest.targetAudience}
주제: ${courseRequest.subject}
도구: ${courseRequest.tools.join(', ')}
시간: ${courseRequest.duration}분 × ${courseRequest.sessionCount}차시

목표:
- 지식: ${courseRequest.knowledgeGoals.join(', ')}
- 기능: ${courseRequest.skillGoals.join(', ')}
- 태도: ${courseRequest.attitudeGoals.join(', ')}

방법: 강의 ${courseRequest.lectureRatio}%, 실습 ${courseRequest.practiceRatio}%, 프로젝트 ${courseRequest.projectRatio}%

위에 제공된 참고 파일들을 분석하여 교육 과정을 설계하세요.
참고 파일에서 관련 내용을 찾아 활용하세요.

JSON 형식으로 출력:
{
  "title": "과정명",
  "overview": "개요 (2문장)",
  "sessions": [
    {
      "session_number": 1,
      "title": "차시명",
      "duration": ${courseRequest.duration},
      "objectives": ["목표1", "목표2"],
      "activities": [
        {
          "type": "강의|실습|프로젝트",
          "duration": 20,
          "title": "활동명",
          "description": "내용",
          "materials": ["자료1"],
          "reference": "참고한 파일명"
        }
      ],
      "assessment": ["평가1"]
    }
  ],
  "overall_materials": ["전체 자료"],
  "tips": ["팁1"],
  "references": ["참조한 파일 목록"]
}

중요: 유효한 JSON만 출력, 코드블록 사용 금지`

  const result = await model.generateContent([
    ...fileRefs,
    prompt,
  ])

  const responseText = result.response.text()
  const generationTime = Date.now() - startTime

  // JSON 파싱
  const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const courseData = JSON.parse(jsonText)

  return {
    courseData,
    sources: files.map(f => ({
      title: f.displayName,
      uri: f.uri,
      fileId: f.name,
    })),
    generationTime,
  }
}

// 파일 없이 일반 RAG 생성 (텍스트 컨텍스트 기반)
export async function generateWithContext(
  prompt: string,
  context: string,
  sources: RAGSource[]
): Promise<RAGResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    },
  })

  const systemPrompt = `당신은 교육과정 설계 전문가입니다.
제공된 참고 자료를 기반으로 답변을 생성하세요.
답변에 포함된 정보의 출처를 명시하세요.

${context}

중요:
- 참고 자료에 기반한 정확한 정보만 제공하세요
- 참고 자료에서 찾을 수 없는 정보는 추측하지 마세요
- 답변 끝에 참조한 자료 번호를 명시하세요`

  const result = await model.generateContent([systemPrompt, prompt])
  const responseText = result.response.text()

  return {
    text: responseText,
    sources,
    modelUsed: 'gemini-2.0-flash',
  }
}

// 추천 자료 설명 생성
export async function explainRecommendation(
  material: {
    title: string
    description: string
    content: string
  },
  courseContext: {
    subject: string
    targetAudience: string
    goals: string[]
  }
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.5,
    },
  })

  const prompt = `다음 교육 자료가 교육 과정에 적합한 이유를 2-3문장으로 설명하세요.

자료:
- 제목: ${material.title}
- 설명: ${material.description}
- 내용 요약: ${material.content.substring(0, 500)}

교육 과정 맥락:
- 주제: ${courseContext.subject}
- 대상: ${courseContext.targetAudience}
- 학습 목표: ${courseContext.goals.join(', ')}

설명:`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
