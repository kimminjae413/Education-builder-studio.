// src/lib/ai/auto-classifier.ts
// 업로드된 자료 AI 자동 분류

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

export interface ClassificationResult {
  mainCategory: string
  mainCategoryConfidence: number
  subCategory: string
  subCategoryConfidence: number
  targetGrade: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  contentType: 'lesson_plan' | 'proposal' | 'activity_sheet' | 'assessment' | 'reference' | 'other'
  autoTags: string[]
  confidence: number
  processingTimeMs: number
}

export const MAIN_CATEGORIES = [
  { id: 'coding', name: '코딩/프로그래밍', keywords: ['코딩', '프로그래밍', '스크래치', '엔트리', '파이썬'] },
  { id: 'robotics', name: '로봇', keywords: ['로봇', '아두이노', '마이크로비트', 'arduino'] },
  { id: 'ai', name: 'AI/머신러닝', keywords: ['인공지능', 'ai', '머신러닝', '딥러닝'] },
  { id: 'maker', name: '메이커/공작', keywords: ['메이커', '만들기', '공작', '3d프린터'] },
  { id: 'science', name: '과학', keywords: ['과학', '실험', '물리', '화학', '생물'] },
  { id: 'math', name: '수학', keywords: ['수학', '연산', '기하', '통계'] },
  { id: 'art', name: '예술/디자인', keywords: ['미술', '예술', '디자인', '그래픽'] },
  { id: 'iot', name: 'IoT/사물인터넷', keywords: ['iot', '사물인터넷', '센서'] },
  { id: 'game', name: '게임개발', keywords: ['게임', '유니티', 'unity'] },
  { id: 'other', name: '기타', keywords: [] },
]

export const CONTENT_TYPES = [
  { id: 'lesson_plan', name: '교육계획안', keywords: ['교육계획', '수업계획', '차시', '학습목표'] },
  { id: 'proposal', name: '제안서', keywords: ['제안서', '프로포절', '사업계획'] },
  { id: 'activity_sheet', name: '활동지', keywords: ['활동지', '워크시트', '학습지'] },
  { id: 'assessment', name: '평가자료', keywords: ['평가', '테스트', '퀴즈', '루브릭'] },
  { id: 'reference', name: '참고자료', keywords: ['참고', '가이드', '매뉴얼'] },
]

export const GRADE_LEVELS = [
  { id: 'kindergarten', name: '유치부', keywords: ['유치원', '유아', '5세', '6세'] },
  { id: 'elementary_low', name: '초등 저학년', keywords: ['초등 1', '초등 2', '1학년', '2학년'] },
  { id: 'elementary_mid', name: '초등 중학년', keywords: ['초등 3', '초등 4', '3학년', '4학년'] },
  { id: 'elementary_high', name: '초등 고학년', keywords: ['초등 5', '초등 6', '5학년', '6학년'] },
  { id: 'middle', name: '중학생', keywords: ['중학', '중등', '중1', '중2', '중3'] },
  { id: 'high', name: '고등학생', keywords: ['고등', '고교', '고1', '고2', '고3'] },
  { id: 'adult', name: '성인', keywords: ['성인', '대학', '일반'] },
]

function classifyByRules(text: string): Partial<ClassificationResult> {
  const lowerText = text.toLowerCase()
  const result: Partial<ClassificationResult> = {}

  for (const cat of MAIN_CATEGORIES) {
    for (const keyword of cat.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        result.mainCategory = cat.id
        result.mainCategoryConfidence = 0.7
        break
      }
    }
    if (result.mainCategory) break
  }

  for (const type of CONTENT_TYPES) {
    for (const keyword of type.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        result.contentType = type.id as ClassificationResult['contentType']
        break
      }
    }
    if (result.contentType) break
  }

  for (const grade of GRADE_LEVELS) {
    for (const keyword of grade.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        result.targetGrade = grade.name
        break
      }
    }
    if (result.targetGrade) break
  }

  if (/초급|입문|기초|beginner/i.test(text)) {
    result.difficulty = 'beginner'
  } else if (/중급|intermediate/i.test(text)) {
    result.difficulty = 'intermediate'
  } else if (/고급|심화|advanced/i.test(text)) {
    result.difficulty = 'advanced'
  }

  const tagKeywords = [
    '아두이노', '라즈베리파이', '마이크로비트', '스크래치', '엔트리', '파이썬',
    'LED', '센서', '모터', '로봇', '드론', '3D프린터', 'VR', 'AR',
    '블록코딩', '텍스트코딩', 'AI', '머신러닝', '알고리즘', 'STEAM', 'PBL',
  ]

  const foundTags: string[] = []
  for (const tag of tagKeywords) {
    if (lowerText.includes(tag.toLowerCase())) {
      foundTags.push(tag)
    }
  }
  result.autoTags = foundTags.slice(0, 10)

  return result
}

async function classifyByAI(text: string): Promise<Partial<ClassificationResult>> {
  const ai = getGenAI()
  const model = ai.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  })

  const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text

  const prompt = `다음 교육 자료를 분류하세요:

"""
${truncatedText}
"""

JSON으로 응답:
{
  "mainCategory": "coding|robotics|ai|maker|science|math|art|iot|game|other",
  "subCategory": "세부 카테고리",
  "targetGrade": "유치부|초등 저학년|초등 중학년|초등 고학년|중학생|고등학생|성인|null",
  "difficulty": "beginner|intermediate|advanced|null",
  "contentType": "lesson_plan|proposal|activity_sheet|assessment|reference|other",
  "autoTags": ["태그1", "태그2", "태그3"]
}

JSON만 응답하세요.`

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('AI 분류 실패:', e)
  }

  return {}
}

export async function classifyDocument(
  text: string,
  options: { useAI?: boolean; fileName?: string } = {}
): Promise<ClassificationResult> {
  const startTime = Date.now()
  const { useAI = true, fileName } = options

  let textWithFileName = text
  if (fileName) {
    textWithFileName = `[파일명: ${fileName}]\n${text}`
  }

  const ruleResult = classifyByRules(textWithFileName)

  let aiResult: Partial<ClassificationResult> = {}
  if (useAI && text.length >= 50) {
    aiResult = await classifyByAI(textWithFileName)
  }

  const merged: ClassificationResult = {
    mainCategory: aiResult.mainCategory || ruleResult.mainCategory || 'other',
    mainCategoryConfidence: aiResult.mainCategory ? 0.9 : (ruleResult.mainCategoryConfidence || 0.5),
    subCategory: aiResult.subCategory || '',
    subCategoryConfidence: aiResult.subCategory ? 0.8 : 0.5,
    targetGrade: aiResult.targetGrade || ruleResult.targetGrade || null,
    difficulty: (aiResult.difficulty || ruleResult.difficulty || null) as ClassificationResult['difficulty'],
    contentType: (aiResult.contentType || ruleResult.contentType || 'other') as ClassificationResult['contentType'],
    autoTags: [...new Set([...(aiResult.autoTags || []), ...(ruleResult.autoTags || [])])].slice(0, 15),
    confidence: aiResult.mainCategory ? 0.85 : 0.6,
    processingTimeMs: Date.now() - startTime,
  }

  return merged
}

export function classificationToText(result: ClassificationResult): string {
  const lines: string[] = []

  const mainCatName = MAIN_CATEGORIES.find(c => c.id === result.mainCategory)?.name || result.mainCategory
  lines.push(`📁 분류: ${mainCatName}${result.subCategory ? ` > ${result.subCategory}` : ''}`)

  if (result.targetGrade) {
    lines.push(`🎯 대상: ${result.targetGrade}`)
  }

  if (result.difficulty) {
    const diffNames = { beginner: '초급', intermediate: '중급', advanced: '고급' }
    lines.push(`📊 난이도: ${diffNames[result.difficulty]}`)
  }

  const contentTypeName = CONTENT_TYPES.find(t => t.id === result.contentType)?.name || result.contentType
  lines.push(`📄 유형: ${contentTypeName}`)

  if (result.autoTags.length > 0) {
    lines.push(`🏷️ 태그: ${result.autoTags.join(', ')}`)
  }

  return lines.join('\n')
}
