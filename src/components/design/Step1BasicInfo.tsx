// src/components/design/Step1BasicInfo.tsx
'use client'

import { CourseDesignData, EDUCATION_TARGET_LABELS, EducationTarget } from '@/lib/design/types'

interface Step1BasicInfoProps {
  data: CourseDesignData
  onChange: (updates: Partial<CourseDesignData>) => void
}

export function Step1BasicInfo({ data, onChange }: Step1BasicInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          기본 정보를 입력해주세요
        </h2>
        <p className="text-gray-600">
          교육 과정의 기본적인 정보를 설정합니다
        </p>
      </div>

      {/* 교육 대상 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교육 대상 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.keys(EDUCATION_TARGET_LABELS) as EducationTarget[]).map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => onChange({ target })}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${
                  data.target === target
                    ? 'border-cobalt-500 bg-cobalt-50 text-cobalt-700'
                    : 'border-gray-200 hover:border-cobalt-200 bg-white'
                }
              `}
            >
              <div className="font-medium">
                {EDUCATION_TARGET_LABELS[target]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 주제/과목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          주제 또는 과목명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="예: 파이썬 프로그래밍 기초, 3D 프린팅 입문"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          구체적인 주제명을 입력하면 더 정확한 커리큘럼을 생성할 수 있습니다
        </p>
      </div>

      {/* 총 교육 기간 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          총 교육 시간 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="1000"
            value={data.totalHours || ''}
            onChange={(e) => onChange({ totalHours: parseInt(e.target.value) || 0 })}
            placeholder="24"
            className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent"
          />
          <span className="text-gray-700 font-medium">시간</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          전체 교육 과정에 필요한 총 시간을 입력하세요 (1~1000시간)
        </p>
      </div>

      {/* 입력 현황 요약 */}
      {data.target && data.subject && data.totalHours > 0 && (
        <div className="mt-6 p-4 bg-cobalt-50 border border-cobalt-200 rounded-lg">
          <h3 className="text-sm font-medium text-cobalt-900 mb-2">
            입력 정보 확인
          </h3>
          <ul className="text-sm text-cobalt-700 space-y-1">
            <li>• 대상: {EDUCATION_TARGET_LABELS[data.target]}</li>
            <li>• 주제: {data.subject}</li>
            <li>• 시간: {data.totalHours}시간</li>
          </ul>
        </div>
      )}
    </div>
  )
}
```

### Commit 메시지:
```
feat: Add Step 1 - Basic Info component

- Add education target selection
- Add subject/topic input
- Add total hours input
- Add input summary display
