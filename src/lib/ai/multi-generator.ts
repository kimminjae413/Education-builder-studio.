// src/lib/ai/multi-generator.ts
// 복수 설계안 생성 - 3가지 타입별 교육과정 생성

import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_MODEL = 'gemini-2.0-flash'

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

export type CourseType = 'lecture' | 'practice' | 'pbl'

export interface CourseTypeInfo {
  type: CourseType
  name: string
  nameKo: string
  description: string
  characteristics: string[]
  ratios: {
    lecture: number
    practice: number
    project: number
  }
}

export const COURSE_TYPES: Record<CourseType, CourseTypeInfo> = {
  lecture: {
    type: 'lecture',
    name: 'Lecture-Focused',
    nameKo: '강의 중심형',
    description: '이론과 개념 설명에 집중하는 전통적인 교육 방식',
    characteristics: [
      '체계적인 이론 전달',
      '개념 이해 중심',
      '교사 주도 수업',
      '단계별 설명',
    ],
    ratios: { lecture: 70, practice: 20, project: 10 },
  },
  practice: {
    type: 'practice',
    name: 'Practice-Focused',
    nameKo: '실습 중심형',
    description: '직접 해보며 배우는 체험 중심 교육 방식',
    characteristics: [
      '손으로 직접 만들기',
      '시행착오를 통한 학습',
      '즉각적인 피드백',
      '개별/소그룹 활동',
    ],
    ratios: { lecture: 20, practice: 70, project: 10 },
  },
  pbl: {
    type: 'pbl',
    name: 'Project-Based Learning',
    nameKo: '프로젝트 기반형',
    description: '실제 문제를 해결하는 프로젝트 중심 교육 방식',
    characteristics: [
      '실생활 문제 해결',
      '팀 협업',
      '자기주도 학습',
      '결과물 발표/공유',
    ],
    ratios: { lecture: 15, practice: 25, project: 60 },
  },
}

export interface MultiCourseRequest {
  target: string
  subject: string
  sessions: number
  duration: number
  goals?: string[]
  tools?: string[]
  constraints?: string
}

export interface SingleCourseResult {
  type: CourseType
  typeInfo: CourseTypeInfo
  proposal: string
  summary: string
  lessonPlans: Array<{
    sessionNumber: number
    title: string
    objectives: string[]
    activities: Array<{
      name: string
      duration: number
      description: string
      activityType: 'lecture' | 'practice' | 'project'
    }>
  }>
  highlights: string[]  // 이 타입의 특장점
}

export interface MultiCourseResult {
  courses: SingleCourseResult[]
  comparison: {
    recommendedType: CourseType
    reason: string
  }
  metadata: {
    generationTimeMs: number
    model: string
  }
}

/**
 * 3가지 타입의 교육과정을 동시에 생성
 */
export async function generateMultipleCourses(
  request: MultiCourseRequest
): Promise<MultiCourseResult> {
  const startTime = Date.now()

  // 3가지 타입 병렬 생성
  const [lectureResult, practiceResult, pblResult] = await Promise.all([
    generateSingleType(request, 'lecture'),
    generateSingleType(request, 'practice'),
    generateSingleType(request, 'pbl'),
  ])

  // 추천 타입 결정
  const comparison = await generateComparison(request, [lectureResult, practiceResult, pblResult])

  return {
    courses: [lectureResult, practiceResult, pblResult],
    comparison,
    metadata: {
      generationTimeMs: Date.now() - startTime,
      model: GEMINI_MODEL,
    },
  }
}

/**
 * 단일 타입 교육과정 생성
 */
async function generateSingleType(
  request: MultiCourseRequest,
  type: CourseType
): Promise<SingleCourseResult> {
  const typeInfo = COURSE_TYPES[type]
  const ai = getGenAI()
  const model = ai.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  })

  const prompt = buildTypePrompt(request, typeInfo)
  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  return parseTypeResponse(responseText, type, typeInfo)
}

/**
 * 타입별 프롬프트 생성
 */
function buildTypePrompt(request: MultiCourseRequest, typeInfo: CourseTypeInfo): string {
  return `당신은 교육과정 설계 전문가입니다.
"${typeInfo.nameKo}" 스타일로 교육과정을 설계해주세요.

## ${typeInfo.nameKo} 특징
- ${typeInfo.characteristics.join('\n- ')}
- 비율: 강의 ${typeInfo.ratios.lecture}% / 실습 ${typeInfo.ratios.practice}% / 프로젝트 ${typeInfo.ratios.project}%

## 교육과정 요청
- 대상: ${request.target}
- 주제: ${request.subject}
- 차시: ${request.sessions}차시
- 시간: ${request.duration}분/차시
${request.goals ? `- 목표: ${request.goals.join(', ')}` : ''}
${request.tools ? `- 도구: ${request.tools.join(', ')}` : ''}
${request.constraints ? `- 조건: ${request.constraints}` : ''}

## 출력 형식 (JSON)
\`\`\`json
{
  "summary": "한줄 요약 (30자 이내)",
  "proposal": "교육 제안서 (마크다운, 300자 이상)",
  "highlights": ["이 타입의 장점1", "장점2", "장점3"],
  "lessonPlans": [
    {
      "sessionNumber": 1,
      "title": "차시 제목",
      "objectives": ["학습목표"],
      "activities": [
        {
          "name": "활동명",
          "duration": 15,
          "description": "설명",
          "activityType": "lecture|practice|project"
        }
      ]
    }
  ]
}
\`\`\`

${typeInfo.nameKo} 특성에 맞게 활동을 구성하세요. 반드시 JSON 형식으로 응답하세요.`
}

/**
 * 응답 파싱
 */
function parseTypeResponse(
  response: string,
  type: CourseType,
  typeInfo: CourseTypeInfo
): SingleCourseResult {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : response
    const parsed = JSON.parse(jsonStr)

    return {
      type,
      typeInfo,
      proposal: parsed.proposal || '',
      summary: parsed.summary || '',
      lessonPlans: parsed.lessonPlans || [],
      highlights: parsed.highlights || [],
    }
  } catch (e) {
    console.error(`${type} 파싱 실패:`, e)
    return {
      type,
      typeInfo,
      proposal: response,
      summary: `${typeInfo.nameKo} 교육과정`,
      lessonPlans: [],
      highlights: typeInfo.characteristics,
    }
  }
}

/**
 * 3가지 타입 비교 및 추천
 */
async function generateComparison(
  request: MultiCourseRequest,
  courses: SingleCourseResult[]
): Promise<{ recommendedType: CourseType; reason: string }> {
  const ai = getGenAI()
  const model = ai.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = `다음 조건에 가장 적합한 교육 방식을 추천해주세요:

대상: ${request.target}
주제: ${request.subject}
차시: ${request.sessions}차시

선택지:
1. 강의 중심형 - 이론 위주, 체계적 전달
2. 실습 중심형 - 직접 해보기, 체험 학습
3. 프로젝트 기반형 - 문제 해결, 팀 협업

JSON으로 응답:
{"recommendedType": "lecture|practice|pbl", "reason": "추천 이유 (50자 이내)"}

JSON만 응답하세요.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        recommendedType: parsed.recommendedType || 'practice',
        reason: parsed.reason || '실습을 통한 학습이 효과적입니다.',
      }
    }
  } catch (e) {
    console.error('비교 생성 실패:', e)
  }

  // 기본값: 대상에 따라 추천
  if (request.target.includes('초등') || request.target.includes('저학년')) {
    return { recommendedType: 'practice', reason: '초등학생은 직접 만들어보는 실습이 효과적입니다.' }
  }
  return { recommendedType: 'pbl', reason: '프로젝트 기반 학습이 깊은 이해를 돕습니다.' }
}

/**
 * 단일 타입만 생성 (빠른 생성용)
 */
export async function generateSingleCourse(
  request: MultiCourseRequest,
  type: CourseType
): Promise<SingleCourseResult> {
  return generateSingleType(request, type)
}
