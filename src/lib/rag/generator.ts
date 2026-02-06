// src/lib/rag/generator.ts
// RAG 기반 교육과정 생성

import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildRAGContext, RAGContext, RetrievalOptions } from './retriever'
import { createCitation, incrementDocumentReferenceCount } from '@/lib/db/queries'

export interface CourseRequest {
  target: string          // 교육 대상 (예: "초등 3학년")
  subject: string         // 주제 (예: "아두이노 기초")
  sessions: number        // 차시 수
  duration: number        // 1차시당 시간 (분)
  goals?: string[]        // 학습 목표
  tools?: string[]        // 사용 도구/교구
  constraints?: string    // 추가 제약 조건
}

export interface LessonPlan {
  sessionNumber: number
  title: string
  objectives: string[]
  activities: Array<{
    name: string
    duration: number
    description: string
    materials?: string[]
  }>
  assessment?: string
}

export interface GenerationResult {
  proposal: string
  lessonPlans: LessonPlan[]
  summary: string
  sources: Array<{
    documentId: string
    documentTitle: string
    relevance: number
  }>
  metadata: {
    model: string
    generationTimeMs: number
    tokensUsed: number
    ragContextTokens: number
  }
}

const GEMINI_MODEL = 'gemini-2.0-flash'

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * RAG 기반 교육과정 생성
 */
export async function generateCourseWithRAG(
  request: CourseRequest,
  retrievalOptions?: RetrievalOptions
): Promise<GenerationResult> {
  const startTime = Date.now()

  // 1. RAG 컨텍스트 구성
  console.log('📚 RAG 컨텍스트 구성 중...')
  const searchQuery = buildSearchQuery(request)
  const ragContext = await buildRAGContext(searchQuery, {
    topK: 15,
    minScore: 0.4,
    maxTokens: 6000,
    ...retrievalOptions,
  })

  console.log(`✅ ${ragContext.sources.length}개 문서에서 ${ragContext.results.length}개 청크 검색됨`)

  // 2. 프롬프트 구성
  const prompt = buildGenerationPrompt(request, ragContext)

  // 3. LLM 생성
  console.log('🤖 교육과정 생성 중...')
  const ai = getGenAI()
  const model = ai.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
  })

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  // 4. 응답 파싱
  const parsed = parseGenerationResponse(responseText, request.sessions)

  // 5. 출처 정보 구성
  const sources = ragContext.sources.map(source => ({
    documentId: source.documentId,
    documentTitle: source.documentTitle,
    relevance: ragContext.results
      .filter(r => r.documentId === source.documentId)
      .reduce((sum, r) => sum + r.score, 0) / source.chunkCount,
  }))

  const generationTimeMs = Date.now() - startTime

  return {
    ...parsed,
    sources,
    metadata: {
      model: GEMINI_MODEL,
      generationTimeMs,
      tokensUsed: estimateTokens(responseText),
      ragContextTokens: ragContext.totalTokens,
    },
  }
}

/**
 * 검색 쿼리 구성
 */
function buildSearchQuery(request: CourseRequest): string {
  const parts = [
    request.subject,
    request.target,
    `${request.sessions}차시`,
  ]

  if (request.tools && request.tools.length > 0) {
    parts.push(request.tools.join(' '))
  }

  if (request.goals && request.goals.length > 0) {
    parts.push(request.goals.join(' '))
  }

  return parts.join(' ')
}

/**
 * 생성 프롬프트 구성
 */
function buildGenerationPrompt(request: CourseRequest, context: RAGContext): string {
  const goalsText = request.goals && request.goals.length > 0
    ? request.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')
    : '(명시되지 않음)'

  const toolsText = request.tools && request.tools.length > 0
    ? request.tools.join(', ')
    : '(명시되지 않음)'

  return `당신은 경험 많은 교육과정 설계 전문가입니다.
아래 제공된 참고 자료를 바탕으로 교육 제안서와 차시별 교육안을 작성해주세요.

## 교육과정 요청 정보

- **교육 대상**: ${request.target}
- **주제**: ${request.subject}
- **총 차시**: ${request.sessions}차시
- **차시당 시간**: ${request.duration}분
- **학습 목표**:
${goalsText}
- **사용 도구/교구**: ${toolsText}
${request.constraints ? `- **추가 조건**: ${request.constraints}` : ''}

## 참고 자료 (베테랑 강사들의 검증된 자료)

${context.contextText}

## 출력 형식

다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "proposal": "교육 제안서 전체 내용 (마크다운 형식, 500자 이상)",
  "summary": "교육과정 한줄 요약 (50자 이내)",
  "lessonPlans": [
    {
      "sessionNumber": 1,
      "title": "차시 제목",
      "objectives": ["학습목표1", "학습목표2"],
      "activities": [
        {
          "name": "활동명",
          "duration": 15,
          "description": "활동 설명",
          "materials": ["필요한 재료"]
        }
      ],
      "assessment": "평가 방법 (선택)"
    }
  ]
}
\`\`\`

## 작성 지침

1. **참고 자료 활용**: 위 참고 자료의 내용을 적극 활용하되, 그대로 복사하지 말고 상황에 맞게 재구성하세요.
2. **실용성**: 실제 교육 현장에서 바로 사용할 수 있도록 구체적으로 작성하세요.
3. **차시 연계성**: 각 차시가 유기적으로 연결되어 학습 목표를 달성할 수 있도록 설계하세요.
4. **시간 배분**: 각 활동의 시간 합이 차시당 시간(${request.duration}분)과 맞도록 하세요.
5. **대상 수준**: ${request.target} 수준에 맞는 난이도와 용어를 사용하세요.

반드시 위 JSON 형식으로만 응답하세요.`
}

/**
 * LLM 응답 파싱
 */
function parseGenerationResponse(
  response: string,
  expectedSessions: number
): { proposal: string; lessonPlans: LessonPlan[]; summary: string } {
  try {
    // JSON 블록 추출
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : response

    // JSON 파싱 시도
    const parsed = JSON.parse(jsonStr)

    return {
      proposal: parsed.proposal || '제안서 생성 실패',
      lessonPlans: parsed.lessonPlans || [],
      summary: parsed.summary || '',
    }
  } catch (e) {
    console.error('JSON 파싱 실패, 텍스트로 처리:', e)

    // 파싱 실패 시 텍스트 그대로 반환
    return {
      proposal: response,
      lessonPlans: generatePlaceholderLessonPlans(expectedSessions),
      summary: '교육과정 생성 완료',
    }
  }
}

/**
 * 플레이스홀더 차시 계획 생성
 */
function generatePlaceholderLessonPlans(sessions: number): LessonPlan[] {
  return Array.from({ length: sessions }, (_, i) => ({
    sessionNumber: i + 1,
    title: `${i + 1}차시`,
    objectives: ['학습 목표를 입력해주세요'],
    activities: [{
      name: '주요 활동',
      duration: 40,
      description: '활동 내용을 입력해주세요',
    }],
  }))
}

/**
 * 토큰 수 추정
 */
function estimateTokens(text: string): number {
  // 한국어 위주: 문자 수 / 2
  // 영어 위주: 단어 수 * 1.3
  const koreanChars = (text.match(/[가-힣]/g) || []).length
  const totalChars = text.length
  const koreanRatio = koreanChars / totalChars

  if (koreanRatio > 0.3) {
    return Math.ceil(text.length / 2)
  } else {
    const words = text.split(/\s+/).length
    return Math.ceil(words * 1.3)
  }
}

/**
 * RAG 인용 정보 저장
 */
export async function saveRAGCitations(
  courseId: string,
  ragContext: RAGContext
): Promise<void> {
  for (const result of ragContext.results) {
    try {
      await createCitation({
        course_id: courseId,
        chunk_id: result.chunkId,
        document_id: result.documentId,
        relevance_score: result.score,
        cited_in_output: true,
      })

      // 문서 참조 횟수 증가
      await incrementDocumentReferenceCount(result.documentId)
    } catch (e) {
      console.error('인용 저장 실패:', e)
    }
  }
}

/**
 * RAG 없이 기본 생성 (폴백용)
 */
export async function generateCourseBasic(
  request: CourseRequest
): Promise<GenerationResult> {
  const startTime = Date.now()

  const prompt = `당신은 교육과정 설계 전문가입니다.
다음 조건에 맞는 교육 제안서와 차시별 교육안을 작성해주세요.

- 교육 대상: ${request.target}
- 주제: ${request.subject}
- 총 차시: ${request.sessions}차시
- 차시당 시간: ${request.duration}분

JSON 형식으로 응답해주세요:
{
  "proposal": "제안서 내용",
  "summary": "한줄 요약",
  "lessonPlans": [...]
}`

  const ai = getGenAI()
  const model = ai.getGenerativeModel({ model: GEMINI_MODEL })
  const result = await model.generateContent(prompt)
  const responseText = result.response.text()
  const parsed = parseGenerationResponse(responseText, request.sessions)

  return {
    ...parsed,
    sources: [],
    metadata: {
      model: GEMINI_MODEL,
      generationTimeMs: Date.now() - startTime,
      tokensUsed: estimateTokens(responseText),
      ragContextTokens: 0,
    },
  }
}
