// src/components/design/Step4Preview.tsx
'use client'

import { 
  CourseDesignData,
  EDUCATION_TARGET_LABELS,
  DIFFICULTY_LABELS,
  TEACHING_METHOD_LABELS,
  ASSESSMENT_METHOD_LABELS
} from '@/lib/design/types'
import { BookOpen, Clock, Target, TrendingUp, Wrench, CheckSquare, Sparkles, Loader2 } from 'lucide-react'

interface Step4PreviewProps {
  data: CourseDesignData
  onSave: () => void
  isSaving?: boolean
}

export function Step4Preview({ data, onSave, isSaving = false }: Step4PreviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          입력 정보를 확인하세요
        </h2>
        <p className="text-gray-600">
          모든 정보가 정확한지 확인한 후 저장하세요
        </p>
      </div>

      {/* 미리보기 카드 */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-cobalt-500 to-cobalt-600 p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">{data.subject}</h3>
              <p className="text-cobalt-100">
                {data.target && EDUCATION_TARGET_LABELS[data.target]} • {data.totalHours}시간
              </p>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-cobalt-600" />
              <h4 className="font-semibold text-gray-900">기본 정보</h4>
            </div>
            <div className="pl-7 space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-600">대상:</span>
                <span className="text-gray-900 font-medium">
                  {data.target && EDUCATION_TARGET_LABELS[data.target]}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">주제:</span>
                <span className="text-gray-900 font-medium">{data.subject}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">시간:</span>
                <span className="text-gray-900 font-medium">{data.totalHours}시간</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* 학습 목표 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-cobalt-600" />
              <h4 className="font-semibold text-gray-900">학습 목표</h4>
            </div>
            <div className="pl-7 space-y-2">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {data.learningObjectives}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-3 py-1 bg-cobalt-100 text-cobalt-700 rounded-full text-xs font-medium">
                  {data.difficulty && DIFFICULTY_LABELS[data.difficulty]}
                </span>
              </div>
            </div>
          </div>

          {data.prerequisites && (
            <>
              <div className="border-t border-gray-200" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-cobalt-600" />
                  <h4 className="font-semibold text-gray-900">선수 지식</h4>
                </div>
                <div className="pl-7">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {data.prerequisites}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-gray-200" />

          {/* 교수법 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-cobalt-600" />
              <h4 className="font-semibold text-gray-900">교수법 & 도구</h4>
            </div>
            <div className="pl-7 space-y-3">
              {data.teachingMethods && data.teachingMethods.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">교수법</p>
                  <div className="flex flex-wrap gap-2">
                    {data.teachingMethods.map((method) => (
                      <span
                        key={method}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {TEACHING_METHOD_LABELS[method]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {data.tools && data.tools.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">사용 도구</p>
                  <div className="flex flex-wrap gap-2">
                    {data.tools.map((tool, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-cobalt-50 text-cobalt-700 rounded-full text-xs"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* 평가 방법 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="w-5 h-5 text-cobalt-600" />
              <h4 className="font-semibold text-gray-900">평가 방법</h4>
            </div>
            <div className="pl-7">
              {data.assessmentMethods && data.assessmentMethods.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.assessmentMethods.map((method) => (
                    <span
                      key={method}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs"
                    >
                      {ASSESSMENT_METHOD_LABELS[method]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI 생성 안내 (나중에 실제 커리큘럼으로 대체) */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              AI 커리큘럼 생성 준비 완료
            </h4>
            <p className="text-sm text-gray-600">
              Gemini API 연동 후, 입력하신 정보를 바탕으로 AI가 자동으로 
              상세한 커리큘럼을 생성해드립니다. 지금은 입력 정보만 저장됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 px-6 py-3 bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <CheckSquare className="w-5 h-5" />
              과정 설계 저장하기
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-center text-gray-500">
        저장 후 대시보드에서 언제든지 수정하거나 삭제할 수 있습니다
      </p>
    </div>
  )
}
