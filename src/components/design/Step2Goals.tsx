// src/components/design/Step2Goals.tsx
'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, Plus, X } from 'lucide-react'

interface Step2Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function Step2Goals({ data, updateData, onNext, onBack }: Step2Props) {
  const [knowledgeInput, setKnowledgeInput] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [attitudeInput, setAttitudeInput] = useState('')

  const handleNext = () => {
    if (data.knowledgeGoals.length === 0) {
      alert('최소 1개 이상의 지식 목표를 입력해주세요')
      return
    }
    if (data.skillGoals.length === 0) {
      alert('최소 1개 이상의 기능 목표를 입력해주세요')
      return
    }
    onNext()
  }

  const addGoal = (type: 'knowledge' | 'skill' | 'attitude', value: string) => {
    if (!value.trim()) return

    if (type === 'knowledge') {
      updateData({ knowledgeGoals: [...data.knowledgeGoals, value.trim()] })
      setKnowledgeInput('')
    } else if (type === 'skill') {
      updateData({ skillGoals: [...data.skillGoals, value.trim()] })
      setSkillInput('')
    } else {
      updateData({ attitudeGoals: [...data.attitudeGoals, value.trim()] })
      setAttitudeInput('')
    }
  }

  const removeGoal = (type: 'knowledge' | 'skill' | 'attitude', index: number) => {
    if (type === 'knowledge') {
      updateData({ knowledgeGoals: data.knowledgeGoals.filter((_: any, i: number) => i !== index) })
    } else if (type === 'skill') {
      updateData({ skillGoals: data.skillGoals.filter((_: any, i: number) => i !== index) })
    } else {
      updateData({ attitudeGoals: data.attitudeGoals.filter((_: any, i: number) => i !== index) })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎯 학습 목표
        </h2>
        <p className="text-gray-600">
          학생들이 무엇을 배우게 될까요?
        </p>
      </div>

      {/* 지식 목표 */}
      <div className="bg-blue-50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💡</span>
          <h3 className="text-lg font-semibold text-gray-900">
            지식 목표 (알게 될 것) <span className="text-red-500">*</span>
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          예: "센서의 종류와 작동 원리를 안다", "변수와 조건문의 개념을 안다"
        </p>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={knowledgeInput}
            onChange={(e) => setKnowledgeInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal('knowledge', knowledgeInput)}
            placeholder="지식 목표를 입력하고 Enter"
            className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          />
          <button
            onClick={() => addGoal('knowledge', knowledgeInput)}
            className="px-4 py-2 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {data.knowledgeGoals.map((goal: string, index: number) => (
            <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg">
              <span className="flex-1 text-sm text-gray-900">{goal}</span>
              <button
                onClick={() => removeGoal('knowledge', index)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 기능 목표 */}
      <div className="bg-green-50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🛠️</span>
          <h3 className="text-lg font-semibold text-gray-900">
            기능 목표 (할 수 있게 될 것) <span className="text-red-500">*</span>
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          예: "센서를 연결하고 데이터를 읽을 수 있다", "간단한 프로그램을 작성할 수 있다"
        </p>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal('skill', skillInput)}
            placeholder="기능 목표를 입력하고 Enter"
            className="flex-1 px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          />
          <button
            onClick={() => addGoal('skill', skillInput)}
            className="px-4 py-2 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {data.skillGoals.map((goal: string, index: number) => (
            <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg">
              <span className="flex-1 text-sm text-gray-900">{goal}</span>
              <button
                onClick={() => removeGoal('skill', index)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 태도 목표 */}
      <div className="bg-purple-50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">❤️</span>
          <h3 className="text-lg font-semibold text-gray-900">
            태도 목표 (갖게 될 태도) <span className="text-gray-400">(선택)</span>
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          예: "문제 해결에 적극적으로 참여한다", "팀원과 협력하는 태도를 갖는다"
        </p>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={attitudeInput}
            onChange={(e) => setAttitudeInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal('attitude', attitudeInput)}
            placeholder="태도 목표를 입력하고 Enter"
            className="flex-1 px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          />
          <button
            onClick={() => addGoal('attitude', attitudeInput)}
            className="px-4 py-2 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {data.attitudeGoals.map((goal: string, index: number) => (
            <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg">
              <span className="flex-1 text-sm text-gray-900">{goal}</span>
              <button
                onClick={() => removeGoal('attitude', index)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
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
          className="flex items-center gap-2 px-6 py-3 bg-cobalt-600 text-white font-medium rounded-lg hover:bg-cobalt-700 transition-colors"
        >
          다음 단계
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
