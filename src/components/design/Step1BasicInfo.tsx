// src/components/design/Step1BasicInfo.tsx
'use client'

import { ArrowRight } from 'lucide-react'

interface Step1Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
}

export function Step1BasicInfo({ data, updateData, onNext }: Step1Props) {
  const handleNext = () => {
    if (!data.targetAudience) {
      alert('대상을 선택해주세요')
      return
    }
    if (!data.subject) {
      alert('주제를 입력해주세요')
      return
    }
    if (data.tools.length === 0) {
      alert('최소 1개 이상의 도구를 선택해주세요')
      return
    }
    onNext()
  }

  const toolOptions = [
    '아두이노', '스크래치', 'mBlock', '엔트리',
    '마이크로비트', '라즈베리파이', '3D프린터',
    '레고 마인드스톰', 'Python', 'JavaScript',
    'Unity', 'Blender', 'Tinkercad', '기타'
  ]

  const toggleTool = (tool: string) => {
    if (data.tools.includes(tool)) {
      updateData({ tools: data.tools.filter((t: string) => t !== tool) })
    } else {
      updateData({ tools: [...data.tools, tool] })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📋 기본 정보
        </h2>
        <p className="text-gray-600">
          어떤 수업을 만들고 싶으신가요?
        </p>
      </div>

      {/* 대상 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          대상 <span className="text-red-500">*</span>
        </label>
        <select
          value={data.targetAudience}
          onChange={(e) => updateData({ targetAudience: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
        >
          <option value="">선택해주세요</option>
          <option value="유아">유아 (5~7세)</option>
          <option value="초등 저학년">초등 저학년 (1~3학년)</option>
          <option value="초등 고학년">초등 고학년 (4~6학년)</option>
          <option value="중학생">중학생</option>
          <option value="고등학생">고등학생</option>
          <option value="대학생">대학생</option>
          <option value="성인">성인</option>
        </select>
      </div>

      {/* 주제 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          주제 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.subject}
          onChange={(e) => updateData({ subject: e.target.value })}
          placeholder="예: 아두이노를 활용한 센서 프로젝트"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
        />
      </div>

      {/* 사용 도구 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사용 도구/교구 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {toolOptions.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${data.tools.includes(tool)
                  ? 'bg-cobalt-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {tool}
            </button>
          ))}
        </div>
        {data.tools.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {data.tools.length}개 선택됨
          </p>
        )}
      </div>

      {/* 수업 시간 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            수업 시간 (분)
          </label>
          <select
            value={data.duration}
            onChange={(e) => updateData({ duration: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          >
            <option value={40}>40분 (1교시)</option>
            <option value={45}>45분</option>
            <option value={60}>60분</option>
            <option value={80}>80분 (2교시)</option>
            <option value={90}>90분</option>
            <option value={120}>120분 (3교시)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            차시 수
          </label>
          <select
            value={data.sessionCount}
            onChange={(e) => updateData({ sessionCount: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((num) => (
              <option key={num} value={num}>
                {num}차시
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="flex justify-end pt-4">
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
