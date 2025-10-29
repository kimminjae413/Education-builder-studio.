// src/lib/design/types.ts

export type EducationTarget = 
  | 'elementary' 
  | 'middle' 
  | 'high' 
  | 'university' 
  | 'adult' 
  | 'corporate'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type TeachingMethod = 
  | 'project_based'
  | 'problem_solving'
  | 'lecture'
  | 'flipped_classroom'
  | 'collaborative'
  | 'experiential'

export type AssessmentMethod = 
  | 'quiz'
  | 'project'
  | 'presentation'
  | 'portfolio'
  | 'peer_review'
  | 'self_assessment'

export interface CourseDesignData {
  // Step 1: 기본 정보
  target: EducationTarget | ''
  subject: string
  totalHours: number
  
  // Step 2: 학습 목표
  learningObjectives: string
  difficulty: Difficulty | ''
  prerequisites: string
  
  // Step 3: 교수법 & 도구
  teachingMethods: TeachingMethod[]
  tools: string[]
  assessmentMethods: AssessmentMethod[]
  
  // Step 4: AI 생성 결과 (나중에 추가)
  generatedCurriculum?: string
}

export const EDUCATION_TARGET_LABELS: Record<EducationTarget, string> = {
  elementary: '초등학생',
  middle: '중학생',
  high: '고등학생',
  university: '대학생',
  adult: '성인 학습자',
  corporate: '기업 교육',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: '초급 (입문)',
  intermediate: '중급 (실습)',
  advanced: '고급 (심화)',
}

export const TEACHING_METHOD_LABELS: Record<TeachingMethod, string> = {
  project_based: '프로젝트 기반 학습 (PBL)',
  problem_solving: '문제 해결 학습',
  lecture: '강의식 수업',
  flipped_classroom: '거꾸로 교실',
  collaborative: '협동 학습',
  experiential: '체험 학습',
}

export const ASSESSMENT_METHOD_LABELS: Record<AssessmentMethod, string> = {
  quiz: '퀴즈/시험',
  project: '프로젝트 결과물',
  presentation: '발표',
  portfolio: '포트폴리오',
  peer_review: '동료 평가',
  self_assessment: '자기 평가',
}

