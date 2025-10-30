// src/components/design/Step3Methods.tsx
'use client'

import { ArrowRight, ArrowLeft } from 'lucide-react'

interface Step3Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function Step3Methods({ data, updateData, onNext, onBack }: Step3Props) {
  const total = data.lectureRatio + data.practiceRatio + data.projectRatio

  const handleRatioChange = (type: string, value: number) => {
    const newData = { ...data, [type]: value }
    const newTotal = newData.lectureRatio + newData.practiceRatio + newData.projectRatio
    
    // 100%가 넘으면 조정
    if (newTotal > 100) {
      return
    }
    
    updateData(newData)
  }

  const handleNext = () => {
    if (total !== 100) {
      alert('비율의 합이 100%가 되어야 합니다')
      return
    }
    onNext()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📚 교수 방법
        </h2>
        <p className="text-gray-600">
          수업은 어떻게 진행될까요?
        </p>
      </div>

      {/* 비율 합계 표시 */}
      <div className={`
        p-4 rounded-xl text-center font-semibold text-lg
        ${total === 100 
          ? 'bg-green-100 text-green-700' 
          : 'bg-amber-100 text-amber-700'
        }
      `}>
        전체 비율: {total}%
        {total !== 100 && ` (${100 - total}% 남음)`}
      </div>

      {/* 강의 비율 */}
      <div className="bg-blue-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👨‍🏫</span>
            <h3 className="text-lg font-semibold text-gray-900">강의 (이론 설명)</h3>
          </div>
          <span className="text-2xl font-bold text-cobalt-600">
            {data.lectureRatio}%
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          개념 설명, 시연, 이론 학습
        </p>
        <input
          type="range"
          min="0"
          max="100"
          value={data.lectureRatio}
          onChange={(e) => handleRatioChange('lectureRatio', parseInt(e.target.value))}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-cobalt-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 실습 비율 */}
      <div className="bg-green-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <h3 className="text-lg font-semibold text-gray-900">실습 (따라하기)</h3>
          </div>
          <span className="text-2xl font-bold text-green-600">
            {data.practiceRatio}%
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          단계별 실습, 예제 코딩, 개별 연습
        </p>
        <input
          type="range"
          min="0"
          max="100"
          value={data.practiceRatio}
          onChange={(e) => handleRatioChange('practiceRatio', parseInt(e.target.value))}
          className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 프로젝트 비율 */}
      <div className="bg-purple-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h3 className="text-lg font-semibold text-gray-900">프로젝트 (창작)</h3>
          </div>
          <span className="text-2xl font-bold text-purple-600">
            {data.projectRatio}%
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          자유 창작, 팀 프로젝트, 문제 해결
        </p>
        <input
          type="range"
          min="0"
          max="100"
          value={data.projectRatio}
          onChange={(e) => handleRatioChange('projectRatio', parseInt(e.target.value))}
          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 추천 비율 */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          💡 추천 비율
        </h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>• <strong>이론 중심:</strong> 강의 50% / 실습 40% / 프로젝트 10%</p>
          <p>• <strong>균형형:</strong> 강의 30% / 실습 50% / 프로젝트 20%</p>
          <p>• <strong>실습 중심:</strong> 강의 20% / 실습 60% / 프로젝트 20%</p>
          <p>• <strong>프로젝트형:</strong> 강의 10% / 실습 30% / 프로젝트 60%</p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={total !== 100}
          className="flex items-center gap-2 px-6 py-3 bg-cobalt-600 text-white font-medium rounded-lg hover:bg-cobalt-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          AI로 생성하기
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
