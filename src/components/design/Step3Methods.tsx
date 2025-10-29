// src/components/design/Step3Methods.tsx
'use client'

import { 
  CourseDesignData, 
  TEACHING_METHOD_LABELS, 
  ASSESSMENT_METHOD_LABELS,
  TeachingMethod,
  AssessmentMethod 
} from '@/lib/design/types'
import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'

interface Step3MethodsProps {
  data: CourseDesignData
  onChange: (updates: Partial<CourseDesignData>) => void
}

export function Step3Methods({ data, onChange }: Step3MethodsProps) {
  const [newTool, setNewTool] = useState('')

  const toggleTeachingMethod = (method: TeachingMethod) => {
    const methods = data.teachingMethods || []
    const updated = methods.includes(method)
      ? methods.filter((m) => m !== method)
      : [...methods, method]
    onChange({ teachingMethods: updated })
  }

  const toggleAssessmentMethod = (method: AssessmentMethod) => {
    const methods = data.assessmentMethods || []
    const updated = methods.includes(method)
      ? methods.filter((m) => m !== method)
      : [...methods, method]
    onChange({ assessmentMethods: updated })
  }

  const addTool = () => {
    if (newTool.trim()) {
      const tools = data.tools || []
      onChange({ tools: [...tools, newTool.trim()] })
      setNewTool('')
    }
  }

  const removeTool = (index: number) => {
    const tools = data.tools || []
    onChange({ tools: tools.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          교수법과 도구를 선택하세요
        </h2>
        <p className="text-gray-600">
          효과적인 교육을 위한 방법론과 활용 도구를 설정합니다
        </p>
      </div>

      {/* 교수법 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          교수법 <span className="text-red-500">*</span>
          <span className="ml-2 text-xs text-gray-500">(1개 이상 선택)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(TEACHING_METHOD_LABELS) as TeachingMethod[]).map((method) => {
            const isSelected = data.teachingMethods?.includes(method)
            
            return (
              <button
                key={method}
                type="button"
                onClick={() => toggleTeachingMethod(method)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${
                    isSelected
                      ? 'border-cobalt-500 bg-cobalt-50'
                      : 'border-gray-200 hover:border-cobalt-200 bg-white'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                      ${
                        isSelected
                          ? 'bg-cobalt-500 text-white'
                          : 'border-2 border-gray-300'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isSelected ? 'text-cobalt-900' : 'text-gray-900'}`}>
                      {TEACHING_METHOD_LABELS[method]}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 사용 도구/플랫폼 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          사용 도구 또는 플랫폼 <span className="text-gray-400">(선택)</span>
        </label>
        
        {/* 도구 입력 */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTool}
            onChange={(e) => setNewTool(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTool()}
            placeholder="예: Scratch, Arduino, Zoom, Google Classroom"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addTool}
            className="px-4 py-2 bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>

        {/* 추가된 도구 목록 */}
        {data.tools && data.tools.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tools.map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-cobalt-100 text-cobalt-700 rounded-full text-sm"
              >
                {tool}
                <button
                  type="button"
                  onClick={() => removeTool(index)}
                  className="hover:bg-cobalt-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        
        <p className="mt-2 text-sm text-gray-500">
          교육에 사용할 소프트웨어, 하드웨어, 온라인 플랫폼 등을 추가하세요
        </p>
      </div>

      {/* 평가 방법 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          평가 방법 <span className="text-red-500">*</span>
          <span className="ml-2 text-xs text-gray-500">(1개 이상 선택)</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.keys(ASSESSMENT_METHOD_LABELS) as AssessmentMethod[]).map((method) => {
            const isSelected = data.assessmentMethods?.includes(method)
            
            return (
              <button
                key={method}
                type="button"
                onClick={() => toggleAssessmentMethod(method)}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${
                    isSelected
                      ? 'border-cobalt-500 bg-cobalt-50'
                      : 'border-gray-200 hover:border-cobalt-200 bg-white'
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`
                      w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5
                      ${
                        isSelected
                          ? 'bg-cobalt-500 text-white'
                          : 'border-2 border-gray-300'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isSelected ? 'text-cobalt-900' : 'text-gray-900'}`}>
                      {ASSESSMENT_METHOD_LABELS[method]}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 입력 현황 요약 */}
      {data.teachingMethods && data.teachingMethods.length > 0 && 
       data.assessmentMethods && data.assessmentMethods.length > 0 && (
        <div className="mt-6 p-4 bg-cobalt-50 border border-cobalt-200 rounded-lg">
          <h3 className="text-sm font-medium text-cobalt-900 mb-2">
            입력 정보 확인
          </h3>
          <ul className="text-sm text-cobalt-700 space-y-1">
            <li>• 교수법: {data.teachingMethods.length}개 선택</li>
            <li>• 도구: {data.tools?.length || 0}개 추가</li>
            <li>• 평가: {data.assessmentMethods.length}개 선택</li>
          </ul>
        </div>
      )}
    </div>
  )
}
