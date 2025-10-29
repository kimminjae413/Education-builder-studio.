// src/components/design/WizardProgress.tsx
'use client'

import { Check } from 'lucide-react'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
}

const STEP_LABELS = [
  '기본 정보',
  '학습 목표',
  '교수법 & 도구',
  '미리보기 & 저장',
]

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="w-full py-6">
      {/* 모바일: 간단한 진행 바 */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {STEP_LABELS[currentStep - 1]}
          </span>
          <span className="text-sm text-gray-500">
            {currentStep} / {totalSteps}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-cobalt-500 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* 데스크톱: 상세 스텝 표시 */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const isUpcoming = stepNumber > currentStep

            return (
              <div key={stepNumber} className="flex items-center flex-1">
                {/* 스텝 원 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      font-semibold text-sm transition-all duration-300
                      ${
                        isCompleted
                          ? 'bg-cobalt-500 text-white'
                          : isCurrent
                          ? 'bg-cobalt-500 text-white ring-4 ring-cobalt-100'
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-xs font-medium text-center
                      ${isCurrent ? 'text-cobalt-600' : 'text-gray-500'}
                    `}
                  >
                    {STEP_LABELS[index]}
                  </span>
                </div>

                {/* 연결선 (마지막 스텝 제외) */}
                {index < totalSteps - 1 && (
                  <div className="flex-1 h-0.5 mx-4 mb-6">
                    <div
                      className={`
                        h-full transition-all duration-300
                        ${isCompleted ? 'bg-cobalt-500' : 'bg-gray-200'}
                      `}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

