// src/components/design/DesignWizard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CourseDesignData } from '@/lib/design/types'
import { WizardProgress } from './WizardProgress'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2Goals } from './Step2Goals'
import { Step3Methods } from './Step3Methods'
import { Step4Preview } from './Step4Preview'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TOTAL_STEPS = 4

export function DesignWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  
  const [data, setData] = useState<CourseDesignData>({
    target: '',
    subject: '',
    totalHours: 0,
    learningObjectives: '',
    difficulty: '',
    prerequisites: '',
    teachingMethods: [],
    tools: [],
    assessmentMethods: [],
  })

  const updateData = (updates: Partial<CourseDesignData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return data.target && data.subject && data.totalHours > 0
      case 2:
        return data.learningObjectives && data.difficulty
      case 3:
        return data.teachingMethods.length > 0 && data.assessmentMethods.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!canProceedToNext()) {
      alert('필수 항목을 입력해주세요')
      return
    }
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // TODO: Supabase에 저장하는 로직 추가
      // 지금은 임시로 localStorage에 저장
      const savedCourses = JSON.parse(localStorage.getItem('courses') || '[]')
      const newCourse = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
      }
      savedCourses.push(newCourse)
      localStorage.setItem('courses', JSON.stringify(savedCourses))

      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('과정 설계가 저장되었습니다! 🎉')
      router.push('/dashboard')
    } catch (error) {
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mt-6">
          {currentStep === 1 && (
            <Step1BasicInfo data={data} onChange={updateData} />
          )}
          
          {currentStep === 2 && (
            <Step2Goals data={data} onChange={updateData} />
          )}
          
          {currentStep === 3 && (
            <Step3Methods data={data} onChange={updateData} />
          )}
          
          {currentStep === 4 && (
            <Step4Preview 
              data={data} 
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}
        </div>

        {currentStep < 4 && (
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                이전
              </button>
            )}
            
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="flex-1 px-6 py-3 bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              다음
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            취소하고 대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
