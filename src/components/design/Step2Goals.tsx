// src/components/design/Step2Goals.tsx
'use client'

import { CourseDesignData, DIFFICULTY_LABELS, Difficulty } from '@/lib/design/types'
import { Target, TrendingUp, Award } from 'lucide-react'

interface Step2GoalsProps {
  data: CourseDesignData
  onChange: (updates: Partial<CourseDesignData>) => void
}

const DIFFICULTY_ICONS = {
  beginner: Target,
  intermediate: TrendingUp,
  advanced: Award,
}

const DIFFICULTY_COLORS = {
  beginner: 'text-green-600 bg-green-50 border-green-200',
  intermediate: 'text-blue-600 bg-blue-50 border-blue-200',
  advanced: 'text-purple-600 bg-purple-50 border-purple-200',
}

export function Step2Goals({ data, onChange }: Step2GoalsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          학습 목표와 난이도를 설정하세요
        </h2>
        <p className="text-gray-600">
          교육 과정의 목표와 학습자 수준을 정의합니다
        </p>
      </div>

      {/* 학습 목표 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          학습 목표 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.learningObjectives}
          onChange={(e) => onChange({ learningObjectives: e.target.value })}
          placeholder="이 과정을 마친 후 학습자가 달성할 수 있는 구체적인 목표를 작성하세요.&#10;&#10;예시:&#10;- 파이썬 기본 문법을 이해하고 간단한 프로그램을 작성할 수 있다&#10;- 변수, 조건문, 반복문을 활용하여 문제를 해결할 수 있다&#10;- 함수를 정의하고 모듈화된 코드를 작성할 수 있다"
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-sm text-gray-500">
          구체적이고 측정 가능한 목표를 여러 개 작성하면 더 좋습니다
        </p>
      </div>

      {/* 난이도 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          난이도 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((difficulty) => {
            const Icon = DIFFICULTY_ICONS[difficulty]
            const isSelected = data.difficulty === difficulty
            
            return (
              <button
                key={difficulty}
                type="button"
                onClick={() => onChange({ difficulty })}
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
                      p-2 rounded-lg
                      ${isSelected ? DIFFICULTY_COLORS[difficulty] : 'bg-gray-100 text-gray-600'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isSelected ? 'text-cobalt-900' : 'text-gray-900'}`}>
                      {DIFFICULTY_LABELS[difficulty]}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {difficulty === 'beginner' && '기초부터 차근차근'}
                      {difficulty === 'intermediate' && '실전 활용 중심'}
                      {difficulty === 'advanced' && '심화 내용 포함'}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 선수 지식 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          선수 지식 또는 요구사항 <span className="text-gray-400">(선택)</span>
        </label>
        <textarea
          value={data.prerequisites}
          onChange={(e) => onChange({ prerequisites: e.target.value })}
          placeholder="이 과정을 수강하기 위해 필요한 선수 지식이나 준비물을 작성하세요.&#10;&#10;예시:&#10;- 컴퓨터 기본 사용 능력&#10;- 간단한 영문 타이핑 가능&#10;- 노트북 지참 필수"
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-sm text-gray-500">
          선수 지식이 없어도 괜찮다면 비워두셔도 됩니다
        </p>
      </div>

      {/* 입력 현황 요약 */}
      {data.learningObjectives && data.difficulty && (
        <div className="mt-6 p-4 bg-cobalt-50 border border-cobalt-200 rounded-lg">
          <h3 className="text-sm font-medium text-cobalt-900 mb-2">
            입력 정보 확인
          </h3>
          <ul className="text-sm text-cobalt-700 space-y-1">
            <li>• 목표: {data.learningObjectives.slice(0, 50)}...</li>
            <li>• 난이도: {DIFFICULTY_LABELS[data.difficulty]}</li>
            {data.prerequisites && (
              <li>• 선수지식: {data.prerequisites.slice(0, 50)}...</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### Commit 메시지:
```
feat: Add Step 2 - Learning Goals component

- Add learning objectives textarea
- Add difficulty level selection
- Add prerequisites input (optional)
- Add visual feedback with icons
