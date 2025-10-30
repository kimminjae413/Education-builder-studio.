// src/components/design/AIDesignWizard.tsx
'use client'

import { useState } from 'react'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2Goals } from './Step2Goals'
import { Step3Methods } from './Step3Methods'
import { Step4Preview } from './Step4Preview'
import { CheckCircle } from 'lucide-react'

interface WizardData {
  // Step 1
  targetAudience: string
  subject: string
  tools: string[]
  duration: number
  sessionCount: number
  
  // Step 2
  knowledgeGoals: string[]
  skillGoals: string[]
  attitudeGoals: string[]
  
  // Step 3
  lectureRatio: number
  practiceRatio: number
  projectRatio: number
}

interface AIDesignWizardProps {
  profile: any
}

export function AIDesignWizard({ profile }: AIDesignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    targetAudience: '',
    subject: '',
    tools: [],
    duration: 60,
    sessionCount: 1,
    knowledgeGoals: [],
    skillGoals: [],
    attitudeGoals: [],
    lectureRatio: 30,
    practiceRatio: 50,
    projectRatio: 20,
  })

  const updateData = (newData: Partial<WizardData>) => {
    setWizardData({ ...wizardData, ...newData })
  }

  const steps = [
    { number: 1, label: '기본 정보', icon: '📋' },
    { number: 2, label: '학습 목표', icon: '🎯' },
    { number: 3, label: '교수 방법', icon: '📚' },
    { number: 4, label: 'AI 생성', icon: '🤖' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* 진행 상태 바 */}
      <div className="bg-gradient-to-r from-cobalt-50 to-cobalt-100 p-6 border-b">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold transition-all
                      ${currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : currentStep === step.number
                        ? 'bg-cobalt-600 text-white ring-4 ring-cobalt-200'
                        : 'bg-white text-gray-400 border-2 border-gray-300'
                      }
                    `}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-sm font-medium
                      ${currentStep >= step.number ? 'text-cobalt-900' : 'text-gray-500'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      h-1 flex-1 mx-4 rounded transition-all
                      ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 단계별 콘텐츠 */}
      <div className="p-6 lg:p-8">
        {currentStep === 1 && (
          <Step1BasicInfo
            data={wizardData}
            updateData={updateData}
            onNext={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 2 && (
          <Step2Goals
            data={wizardData}
            updateData={updateData}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <Step3Methods
            data={wizardData}
            updateData={updateData}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <Step4Preview
            data={wizardData}
            profile={profile}
            onBack={() => setCurrentStep(3)}
            onReset={() => {
              setCurrentStep(1)
              setWizardData({
                targetAudience: '',
                subject: '',
                tools: [],
                duration: 60,
                sessionCount: 1,
                knowledgeGoals: [],
                skillGoals: [],
                attitudeGoals: [],
                lectureRatio: 30,
                practiceRatio: 50,
                projectRatio: 20,
              })
            }}
          />
        )}
      </div>
    </div>
  )
}
