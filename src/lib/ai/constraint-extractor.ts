// src/lib/ai/constraint-extractor.ts
// 입력에서 제약 조건을 자동으로 도출

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

export interface ExtractedConstraints {
  // 대상 관련
  targetAge: string | null           // 연령대 (예: "8-10세")
  targetGrade: string | null         // 학년 (예: "초등 3학년")
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | null
  groupSize: 'individual' | 'small' | 'large' | null

  // 내용 관련
  subjectArea: string | null         // 과목 영역
  prerequisites: string[]            // 선수 지식
  learningStyle: string[]            // 학습 스타일 (시각, 청각, 운동감각)

  // 환경 관련
  equipmentNeeded: string[]          // 필요 장비
  spaceRequirements: string | null   // 공간 요구사항
  budgetLevel: 'low' | 'medium' | 'high' | null

  // 시간 관련
  totalDuration: number | null       // 총 시간 (분)
  sessionLength: number | null       // 차시당 시간
  sessionCount: number | null        // 차시 수
  pacing: 'slow' | 'normal' | 'fast' | null

  // 목표 관련
  knowledgeGoals: string[]           // 지식 목표
  skillGoals: string[]               // 기능 목표
  attitudeGoals: string[]            // 태도 목표

  // 기타
  specialNeeds: string[]             // 특수 요구사항
  restrictions: string[]             // 제한사항
  preferences: string[]              // 선호사항

  // 메타
  confidence: number                 // 추출 신뢰도 (0-1)
  rawInput: string                   // 원본 입력
}

/**
 * 사용자 입력에서 제약 조건 자동 추출
 */
export async function extractConstraints(input: {
  target?: string
  subject?: string
  goals?: string
  tools?: string
  duration?: string
  additionalInfo?: string
}): Promise<ExtractedConstraints> {
  const rawInput = Object.values(input).filter(Boolean).join(' | ')

  // 1. 규칙 기반 추출 (빠름)
  const ruleBasedConstraints = extractByRules(input)

  // 2. AI 기반 추출 (정확함)
  const aiConstraints = await extractByAI(rawInput)

  // 3. 병합 (규칙 기반 우선, AI로 보완)
  return mergeConstraints(ruleBasedConstraints, aiConstraints, rawInput)
}

/**
 * 규칙 기반 제약 조건 추출
 */
function extractByRules(input: {
  target?: string
  subject?: string
  goals?: string
  tools?: string
  duration?: string
  additionalInfo?: string
}): Partial<ExtractedConstraints> {
  const constraints: Partial<ExtractedConstraints> = {}
  const allText = Object.values(input).filter(Boolean).join(' ').toLowerCase()

  // 학년 추출
  const gradePatterns: [RegExp, string][] = [
    [/유치원|유아|5-6세|5세|6세/, '유치부'],
    [/초등\s*1학년|1학년|7세|8세/, '초등 1학년'],
    [/초등\s*2학년|2학년|8세|9세/, '초등 2학년'],
    [/초등\s*3학년|3학년|9세|10세/, '초등 3학년'],
    [/초등\s*4학년|4학년|10세|11세/, '초등 4학년'],
    [/초등\s*5학년|5학년|11세|12세/, '초등 5학년'],
    [/초등\s*6학년|6학년|12세|13세/, '초등 6학년'],
    [/초등\s*저학년|저학년/, '초등 저학년'],
    [/초등\s*고학년|고학년/, '초등 고학년'],
    [/중학생|중등|중학교/, '중학생'],
    [/고등학생|고등|고교/, '고등학생'],
    [/성인|대학생|일반/, '성인'],
  ]

  for (const [pattern, grade] of gradePatterns) {
    if (pattern.test(allText)) {
      constraints.targetGrade = grade
      break
    }
  }

  // 수준 추출
  if (/초급|입문|기초|처음|beginner/i.test(allText)) {
    constraints.targetLevel = 'beginner'
  } else if (/중급|intermediate/i.test(allText)) {
    constraints.targetLevel = 'intermediate'
  } else if (/고급|심화|advanced/i.test(allText)) {
    constraints.targetLevel = 'advanced'
  }

  // 도구 추출
  const toolPatterns: [RegExp, string][] = [
    [/아두이노|arduino/, '아두이노'],
    [/라즈베리\s*파이|raspberry/i, '라즈베리파이'],
    [/마이크로\s*비트|microbit/i, '마이크로비트'],
    [/레고|lego/i, '레고'],
    [/스크래치|scratch/i, '스크래치'],
    [/엔트리|entry/i, '엔트리'],
    [/파이썬|python/i, '파이썬'],
    [/3d\s*프린터|3d\s*printer/i, '3D프린터'],
    [/드론|drone/i, '드론'],
    [/vr|가상현실/, 'VR'],
    [/ai|인공지능/, 'AI'],
  ]

  const foundTools: string[] = []
  for (const [pattern, tool] of toolPatterns) {
    if (pattern.test(allText)) {
      foundTools.push(tool)
    }
  }
  if (foundTools.length > 0) {
    constraints.equipmentNeeded = foundTools
  }

  // 시간 추출
  const durationMatch = allText.match(/(\d+)\s*분/)
  if (durationMatch) {
    constraints.sessionLength = parseInt(durationMatch[1])
  }

  const sessionMatch = allText.match(/(\d+)\s*차시/)
  if (sessionMatch) {
    constraints.sessionCount = parseInt(sessionMatch[1])
  }

  // 그룹 크기 추출
  if (/개별|개인|1:1|일대일/.test(allText)) {
    constraints.groupSize = 'individual'
  } else if (/소그룹|소규모|4-6명|5명/.test(allText)) {
    constraints.groupSize = 'small'
  } else if (/대그룹|전체|학급|20명|30명/.test(allText)) {
    constraints.groupSize = 'large'
  }

  // 과목 영역 추출
  const subjectPatterns: [RegExp, string][] = [
    [/코딩|프로그래밍|coding/i, '코딩'],
    [/로봇|로보틱스|robot/i, '로봇'],
    [/과학|science/i, '과학'],
    [/수학|math/i, '수학'],
    [/메이커|maker|만들기/i, '메이커'],
    [/ai|인공지능|머신러닝/i, 'AI'],
    [/iot|사물인터넷/i, 'IoT'],
    [/예술|미술|art/i, '예술'],
    [/음악|music/i, '음악'],
  ]

  for (const [pattern, subject] of subjectPatterns) {
    if (pattern.test(allText)) {
      constraints.subjectArea = subject
      break
    }
  }

  return constraints
}

/**
 * AI 기반 제약 조건 추출
 */
async function extractByAI(rawInput: string): Promise<Partial<ExtractedConstraints>> {
  if (!rawInput || rawInput.length < 10) {
    return {}
  }

  const ai = getGenAI()
  const model = ai.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  })

  const prompt = `다음 교육과정 요청에서 제약 조건을 추출하세요:

입력: "${rawInput}"

JSON으로 응답 (해당하는 것만):
{
  "targetAge": "연령대 (예: 8-10세)",
  "targetLevel": "beginner|intermediate|advanced",
  "prerequisites": ["선수지식1", "선수지식2"],
  "knowledgeGoals": ["지식목표1"],
  "skillGoals": ["기능목표1"],
  "attitudeGoals": ["태도목표1"],
  "specialNeeds": ["특수요구사항"],
  "restrictions": ["제한사항"],
  "pacing": "slow|normal|fast",
  "budgetLevel": "low|medium|high"
}

JSON만 응답하세요.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('AI 제약조건 추출 실패:', e)
  }

  return {}
}

/**
 * 규칙 기반과 AI 기반 결과 병합
 */
function mergeConstraints(
  ruleBased: Partial<ExtractedConstraints>,
  aiBased: Partial<ExtractedConstraints>,
  rawInput: string
): ExtractedConstraints {
  // 기본값
  const defaults: ExtractedConstraints = {
    targetAge: null,
    targetGrade: null,
    targetLevel: null,
    groupSize: null,
    subjectArea: null,
    prerequisites: [],
    learningStyle: [],
    equipmentNeeded: [],
    spaceRequirements: null,
    budgetLevel: null,
    totalDuration: null,
    sessionLength: null,
    sessionCount: null,
    pacing: 'normal',
    knowledgeGoals: [],
    skillGoals: [],
    attitudeGoals: [],
    specialNeeds: [],
    restrictions: [],
    preferences: [],
    confidence: 0.5,
    rawInput,
  }

  // 규칙 기반 결과로 덮어쓰기 (우선)
  const merged = { ...defaults, ...aiBased, ...ruleBased }

  // 배열 병합
  merged.prerequisites = [...new Set([...(ruleBased.prerequisites || []), ...(aiBased.prerequisites || [])])]
  merged.equipmentNeeded = [...new Set([...(ruleBased.equipmentNeeded || []), ...(aiBased.equipmentNeeded || [])])]
  merged.knowledgeGoals = [...new Set([...(ruleBased.knowledgeGoals || []), ...(aiBased.knowledgeGoals || [])])]
  merged.skillGoals = [...new Set([...(ruleBased.skillGoals || []), ...(aiBased.skillGoals || [])])]
  merged.attitudeGoals = [...new Set([...(ruleBased.attitudeGoals || []), ...(aiBased.attitudeGoals || [])])]

  // 신뢰도 계산
  let filledFields = 0
  const totalFields = 15
  if (merged.targetGrade) filledFields++
  if (merged.targetLevel) filledFields++
  if (merged.subjectArea) filledFields++
  if (merged.sessionLength) filledFields++
  if (merged.sessionCount) filledFields++
  if (merged.equipmentNeeded.length > 0) filledFields++
  if (merged.knowledgeGoals.length > 0) filledFields++
  if (merged.skillGoals.length > 0) filledFields++

  merged.confidence = filledFields / totalFields

  return merged
}

/**
 * 제약 조건을 사람이 읽기 쉬운 텍스트로 변환
 */
export function constraintsToText(constraints: ExtractedConstraints): string {
  const lines: string[] = []

  if (constraints.targetGrade) {
    lines.push(`📚 대상: ${constraints.targetGrade}`)
  }
  if (constraints.targetLevel) {
    const levelNames = { beginner: '초급', intermediate: '중급', advanced: '고급' }
    lines.push(`📊 수준: ${levelNames[constraints.targetLevel]}`)
  }
  if (constraints.subjectArea) {
    lines.push(`🎯 영역: ${constraints.subjectArea}`)
  }
  if (constraints.sessionCount && constraints.sessionLength) {
    lines.push(`⏱️ 시간: ${constraints.sessionCount}차시 × ${constraints.sessionLength}분`)
  }
  if (constraints.equipmentNeeded.length > 0) {
    lines.push(`🔧 도구: ${constraints.equipmentNeeded.join(', ')}`)
  }
  if (constraints.knowledgeGoals.length > 0) {
    lines.push(`💡 지식목표: ${constraints.knowledgeGoals.join(', ')}`)
  }
  if (constraints.skillGoals.length > 0) {
    lines.push(`🛠️ 기능목표: ${constraints.skillGoals.join(', ')}`)
  }

  return lines.join('\n')
}

/**
 * 제약 조건을 검색 필터로 변환 (RAG용)
 */
export function constraintsToSearchFilter(constraints: ExtractedConstraints): Record<string, unknown> {
  const filter: Record<string, unknown> = {}

  if (constraints.targetGrade) {
    filter.target_category = constraints.targetGrade
  }
  if (constraints.subjectArea) {
    filter.subject_category = constraints.subjectArea
  }
  if (constraints.targetLevel) {
    const difficultyMap = { beginner: 'low', intermediate: 'medium', advanced: 'high' }
    filter.difficulty = difficultyMap[constraints.targetLevel]
  }
  if (constraints.equipmentNeeded.length > 0) {
    filter.tool_categories = constraints.equipmentNeeded
  }

  return filter
}
