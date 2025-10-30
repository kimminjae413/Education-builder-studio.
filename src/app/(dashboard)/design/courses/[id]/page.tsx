// src/app/(dashboard)/design/courses/[id]/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Clock, Users, Calendar, Download, Share2, Bookmark, Eye } from 'lucide-react'
import Link from 'next/link'
import { RecommendedMaterials } from '@/components/design/RecommendedMaterials'

interface CourseDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 과정 데이터 가져오기
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles:user_id (
        name,
        email,
        rank
      )
    `)
    .eq('id', id)
    .single()

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">과정을 찾을 수 없습니다</h1>
          <p className="text-gray-600">요청하신 과정이 존재하지 않거나 삭제되었습니다.</p>
          <Link 
            href="/design"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cobalt-500 text-white hover:bg-cobalt-600 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            AI 설계로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 조회수 증가
  if (course.user_id !== user.id) {
    await supabase
      .from('courses')
      .update({ views_count: (course.views_count || 0) + 1 })
      .eq('id', id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/design"
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로 가기
            </Link>
            
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Bookmark className="h-4 w-4" />
                북마크
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Share2 className="h-4 w-4" />
                공유
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
                다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* 제목 & 메타 정보 */}
        <div className="bg-white rounded-lg border p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{course.target_audience}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}분 × {course.session_count}차시</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(course.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>조회 {course.views_count || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 주제 & 도구 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주제
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                {course.subject}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용 도구/교구
              </label>
              <div className="flex flex-wrap gap-1.5">
                {course.tools?.map((tool: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-cobalt-50 text-cobalt-700 rounded text-sm"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 교수 방법 비율 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              교수 방법 비율
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-cobalt-600 mb-1">
                  {course.lecture_ratio}%
                </div>
                <div className="text-sm text-gray-600">강의</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {course.practice_ratio}%
                </div>
                <div className="text-sm text-gray-600">실습</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {course.project_ratio}%
                </div>
                <div className="text-sm text-gray-600">프로젝트</div>
              </div>
            </div>
          </div>
        </div>

        {/* 학습 목표 */}
        <div className="bg-white rounded-lg border p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📚 학습 목표
          </h2>
          
          {course.knowledge_goals && course.knowledge_goals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                🧠 지식 목표
              </h3>
              <ul className="space-y-2">
                {course.knowledge_goals.map((goal: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-cobalt-500 mt-1">•</span>
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.skill_goals && course.skill_goals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                ⚡ 기능 목표
              </h3>
              <ul className="space-y-2">
                {course.skill_goals.map((goal: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.attitude_goals && course.attitude_goals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                💚 태도 목표
              </h3>
              <ul className="space-y-2">
                {course.attitude_goals.map((goal: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 수업 계획안 */}
        {course.lesson_plan && (
          <div className="bg-white rounded-lg border p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📝 수업 계획안
            </h2>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {course.lesson_plan}
              </div>
            </div>
          </div>
        )}

        {/* 차시별 활동 */}
        {course.activities && Array.isArray(course.activities) && course.activities.length > 0 && (
          <div className="bg-white rounded-lg border p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              🎯 차시별 활동
            </h2>
            <div className="space-y-8">
              {course.activities.map((session: any, sessionIndex: number) => {
                // 1. 문자열인 경우
                if (typeof session === 'string') {
                  return (
                    <div key={sessionIndex} className="border-l-4 border-cobalt-500 pl-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        📅 {sessionIndex + 1}차시
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {session}
                      </p>
                    </div>
                  )
                }

                // 2. 배열인 경우 (가장 흔한 케이스)
                if (Array.isArray(session)) {
                  return (
                    <div key={sessionIndex} className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cobalt-500">
                        📅 {sessionIndex + 1}차시
                      </h3>
                      
                      <div className="space-y-4">
                        {session.map((activity: any, activityIndex: number) => {
                          // 활동이 문자열인 경우
                          if (typeof activity === 'string') {
                            return (
                              <div key={activityIndex} className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700">{activity}</p>
                              </div>
                            )
                          }

                          // 활동이 객체인 경우
                          const type = activity.type || '활동'
                          const title = activity.title || `활동 ${activityIndex + 1}`
                          const description = activity.description || ''
                          const duration = activity.duration
                          const materials = activity.materials || []

                          // 타입별 색상
                          const typeStyles: Record<string, { bg: string; border: string; text: string }> = {
                            '강의': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
                            '실습': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
                            '프로젝트': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
                            '평가': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
                          }
                          const style = typeStyles[type] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }

                          return (
                            <div key={activityIndex} className={`rounded-lg border-2 ${style.border} ${style.bg} p-5 transition-all hover:shadow-md`}>
                              {/* 헤더: 타입과 시간 */}
                              <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${style.text} bg-white border-2 ${style.border}`}>
                                  {type}
                                </span>
                                {duration && (
                                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200">
                                    ⏱️ {duration}분
                                  </span>
                                )}
                              </div>

                              {/* 제목 */}
                              <h4 className="text-base font-bold text-gray-900 mb-3">
                                {title}
                              </h4>

                              {/* 설명 */}
                              {description && (
                                <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                                  {description}
                                </p>
                              )}

                              {/* 필요 자료 */}
                              {materials && Array.isArray(materials) && materials.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-sm font-bold text-gray-700 mb-3">
                                    📦 필요한 자료
                                  </p>
                                  <ul className="space-y-2">
                                    {materials.map((material: any, mIndex: number) => {
                                      const materialText = typeof material === 'string' ? material : JSON.stringify(material)
                                      return (
                                        <li key={mIndex} className="flex items-start gap-2 text-sm text-gray-600">
                                          <span className="text-cobalt-500 font-bold mt-0.5">•</span>
                                          <span className="flex-1">{materialText}</span>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                // 3. 단일 객체인 경우
                const title = session.title || session.session || session.name || `차시 ${sessionIndex + 1}`
                const description = session.description || session.content || ''
                const duration = session.duration
                const objectives = session.objectives

                return (
                  <div key={sessionIndex} className="border-l-4 border-cobalt-500 pl-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      📅 {sessionIndex + 1}차시: {title}
                    </h3>
                    
                    {description && (
                      <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                        {typeof description === 'string' ? description : JSON.stringify(description, null, 2)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {duration && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">⏱️</span>
                          <span>{duration}분</span>
                        </div>
                      )}
                      {objectives && (
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold">🎯</span>
                          <span>{Array.isArray(objectives) ? objectives.join(', ') : objectives}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 평가 방법 */}
        {course.assessment_methods && course.assessment_methods.length > 0 && (
          <div className="bg-white rounded-lg border p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ✅ 평가 방법
            </h2>
            <div className="grid gap-3">
              {course.assessment_methods.map((method: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-cobalt-100 text-cobalt-600 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{method}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 필요 자료 */}
        {course.materials_needed && course.materials_needed.length > 0 && (
          <div className="bg-white rounded-lg border p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📦 필요한 자료 및 준비물
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {course.materials_needed.map((material: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-cobalt-500">✓</span>
                  <span className="text-gray-700">{material}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 추천 자료 섹션 */}
        <div className="mt-8">
          <RecommendedMaterials courseId={course.id} />
        </div>

        {/* 하단 액션 버튼 */}
        <div className="mt-8 flex gap-4">
          <Link href="/design" className="flex-1">
            <button className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              새로운 과정 만들기
            </button>
          </Link>
          <button className="flex-1 px-4 py-2 bg-cobalt-500 text-white hover:bg-cobalt-600 rounded-lg transition-colors">
            이 과정 수정하기
          </button>
        </div>
      </div>
    </div>
  )
}
