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

  // activities 파싱 및 정규화
  if (course.activities) {
    // JSON 문자열이면 파싱
    if (typeof course.activities === 'string') {
      try {
        course.activities = JSON.parse(course.activities)
      } catch (e) {
        console.error('Failed to parse activities:', e)
      }
    }
    
    // activities가 배열이고, 각 요소가 세션 객체라면
    if (Array.isArray(course.activities)) {
      // 각 세션에서 activities 배열만 추출
      course.activities = course.activities.map((session: any) => {
        // 세션 객체에 activities 속성이 있으면 그것을 사용
        if (session && typeof session === 'object' && session.activities) {
          return session.activities
        }
        // 없으면 세션 전체를 반환 (이미 activities 배열인 경우)
        return session
      })
    }
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
            <div className="space-y-10">
              {course.activities.map((session: any, sessionIndex: number) => {
                // 배열인 경우 (각 차시가 여러 활동을 포함)
                if (Array.isArray(session)) {
                  return (
                    <div key={sessionIndex} className="space-y-5">
                      <div className="flex items-center gap-3 pb-3 border-b-2 border-cobalt-500">
                        <span className="text-2xl">📅</span>
                        <h3 className="text-xl font-bold text-gray-900">
                          {sessionIndex + 1}차시
                        </h3>
                      </div>
                      
                      <div className="space-y-6 pl-2">
                        {session.map((activity: any, activityIndex: number) => {
                          const type = activity.type || '활동'
                          const title = activity.title || ''
                          const description = activity.description || ''
                          const duration = activity.duration
                          const materials = activity.materials || []

                          // 타입별 이모지
                          const typeEmoji: Record<string, string> = {
                            '강의': '📖',
                            '실습': '🔧',
                            '프로젝트': '🎨',
                            '평가': '✅',
                          }
                          const emoji = typeEmoji[type] || '📌'

                          return (
                            <div key={activityIndex} className="space-y-3">
                              {/* 타입과 제목 */}
                              <div className="flex items-start gap-3">
                                <span className="text-2xl flex-shrink-0">{emoji}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="inline-block px-3 py-1 bg-cobalt-100 text-cobalt-700 rounded-full text-sm font-semibold">
                                      {type}
                                    </span>
                                    {duration && (
                                      <span className="text-sm text-gray-600">
                                        ⏱️ <strong>{duration}분</strong>
                                      </span>
                                    )}
                                  </div>
                                  
                                  {title && (
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                                      {title}
                                    </h4>
                                  )}
                                  
                                  {description && (
                                    <p className="text-gray-700 leading-relaxed mb-3">
                                      {description}
                                    </p>
                                  )}
                                  
                                  {/* 필요 자료 */}
                                  {materials && Array.isArray(materials) && materials.length > 0 && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                      <p className="text-sm font-semibold text-gray-700 mb-2">
                                        📦 필요한 자료
                                      </p>
                                      <ul className="space-y-1.5">
                                        {materials.map((material: any, mIndex: number) => {
                                          const materialText = typeof material === 'string' ? material : String(material)
                                          return (
                                            <li key={mIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                              <span className="text-cobalt-500 mt-1">•</span>
                                              <span className="flex-1">{materialText}</span>
                                            </li>
                                          )
                                        })}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* 구분선 (마지막 활동 제외) */}
                              {activityIndex < session.length - 1 && (
                                <div className="border-b border-gray-200 my-4"></div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                // 문자열이나 단일 객체인 경우
                return (
                  <div key={sessionIndex} className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b-2 border-cobalt-500">
                      <span className="text-2xl">📅</span>
                      <h3 className="text-xl font-bold text-gray-900">
                        {sessionIndex + 1}차시
                      </h3>
                    </div>
                    <div className="text-gray-700 leading-relaxed pl-2 whitespace-pre-wrap">
                      {typeof session === 'string' ? session : JSON.stringify(session, null, 2)}
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
