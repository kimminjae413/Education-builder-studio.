// src/components/design/Step4Preview.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Loader2, CheckCircle, Download } from 'lucide-react'

interface Step4Props {
  data: any
  profile: any
  onBack: () => void
  onReset: () => void
}

export function Step4Preview({ data, profile, onBack, onReset }: Step4Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [courseData, setCourseData] = useState<any>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '과정 생성에 실패했습니다')
      }

      setCourseData(result.course)
      setGenerated(true)

    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleNewCourse = () => {
    onReset()
    setGenerated(false)
    setCourseData(null)
    router.refresh()
  }

  if (generating) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-cobalt-50 to-purple-50 rounded-2xl p-12 text-center">
          <Loader2 className="h-16 w-16 text-cobalt-600 animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            🤖 AI가 과정을 설계하고 있습니다...
          </h3>
          <p className="text-gray-600 mb-6">
            잠시만 기다려주세요. 최적의 교육과정을 만들고 있어요.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✓ 시드 데이터 분석 중...</p>
            <p>✓ 학습 목표 기반 활동 설계 중...</p>
            <p>✓ 수업 흐름 최적화 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (generated && courseData) {
    const content = courseData.ai_generated_content

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 성공 메시지 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                ✨ 교육과정이 생성되었습니다!
              </h3>
              <p className="text-sm text-green-700">
                {courseData.generation_time_ms}ms 소요
              </p>
            </div>
          </div>
        </div>

        {/* 과정 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {content.title}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {content.overview}
          </p>
        </div>

        {/* 차시별 내용 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📚 차시별 수업 계획
          </h3>
          {content.sessions.map((session: any, index: number) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-cobalt-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-cobalt-600">
                    {session.session_number}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {session.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {session.duration}분
                  </p>
                </div>
              </div>

              {/* 목표 */}
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">목표:</h5>
                <ul className="space-y-1">
                  {session.objectives.map((obj: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span>•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 활동 */}
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">활동:</h5>
                <div className="space-y-3">
                  {session.activities.map((activity: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </span>
                        <span className="text-xs px-2 py-1 bg-cobalt-100 text-cobalt-700 rounded">
                          {activity.type} · {activity.duration}분
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {activity.description}
                      </p>
                      {activity.materials && activity.materials.length > 0 && (
                        <div className="text-xs text-gray-500">
                          필요 자료: {activity.materials.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 평가 */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2">평가:</h5>
                <ul className="space-y-1">
                  {session.assessment.map((assess: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span>•</span>
                      <span>{assess}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* 전체 자료 */}
        {content.overall_materials && content.overall_materials.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              📦 필요한 자료
            </h4>
            <ul className="grid md:grid-cols-2 gap-2">
              {content.overall_materials.map((material: string, i: number) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span>•</span>
                  <span>{material}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 팁 */}
        {content.tips && content.tips.length > 0 && (
          <div className="bg-purple-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              💡 강사를 위한 팁
            </h4>
            <ul className="space-y-2">
              {content.tips.map((tip: string, i: number) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleNewCourse}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            새 과정 만들기
          </button>
          <button
            onClick={() => router.push('/design/courses')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cobalt-600 text-white font-medium rounded-lg hover:bg-cobalt-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            내 과정 보기
          </button>
        </div>
      </div>
    )
  }

  // 초기 상태 - 입력 내용 확인
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🤖 입력 내용 확인
        </h2>
        <p className="text-gray-600">
          아래 내용으로 AI가 교육과정을 생성합니다
        </p>
      </div>

      {/* 요약 */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y">
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">대상 & 주제</h4>
          <p className="text-gray-900">
            <strong>{data.targetAudience}</strong>를 위한 <strong>{data.subject}</strong>
          </p>
        </div>

        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">시간</h4>
          <p className="text-gray-900">
            {data.duration}분 × {data.sessionCount}차시
          </p>
        </div>

        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">사용 도구</h4>
          <p className="text-gray-900">{data.tools.join(', ')}</p>
        </div>

        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">학습 목표</h4>
          <div className="space-y-2 text-sm">
            <p className="text-gray-900">
              <strong>지식:</strong> {data.knowledgeGoals.length}개
            </p>
            <p className="text-gray-900">
              <strong>기능:</strong> {data.skillGoals.length}개
            </p>
            {data.attitudeGoals.length > 0 && (
              <p className="text-gray-900">
                <strong>태도:</strong> {data.attitudeGoals.length}개
              </p>
            )}
          </div>
        </div>

        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">교수 방법 비율</h4>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
              강의 {data.lectureRatio}%
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">
              실습 {data.practiceRatio}%
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded">
              프로젝트 {data.projectRatio}%
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

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
          onClick={handleGenerate}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cobalt-600 to-purple-600 text-white font-medium rounded-lg hover:from-cobalt-700 hover:to-purple-700 transition-colors"
        >
          <Sparkles className="h-5 w-5" />
          AI로 생성하기
        </button>
      </div>
    </div>
  )
}
