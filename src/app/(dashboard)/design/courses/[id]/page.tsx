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
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🎯 차시별 활동
            </h2>
            <div className="space-y-6">
              {course.activities.map((activity: any, index: number) => {
                // activity가 문자열인 경우
                if (typeof activity === 'string') {
                  return (
                    <div key={index} className="border-l-4 border-cobalt-500 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {index + 1}차시
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {activity}
                      </p>
                    </div>
                  )
                }
                
                // activity가 배열인 경우 (각 차시가 여러 활동을 포함)
                if (Array.isArray(activity)) {
                  return (
                    <div key={index} className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        📅 {index + 1}차시
                      </h3>
                      
                      {activity.map((subActivity: any, subIndex: number) => {
                        const type = subActivity.type || '활동'
                        const title = subActivity.title || `활동 ${subIndex + 1}`
                        const description = subActivity.description || ''
                        const duration = subActivity.duration
                        const materials = subActivity.materials || []
                        
                        // 타입별 색상
                        const typeColors: Record<string, string> = {
                          '강의': 'bg-blue-50 border-blue-200 text-blue-700',
                          '실습': 'bg-green-50 border-green-200 text-green-700',
                          '프로젝트': 'bg-purple-50 border-purple-200 text-purple-700',
                          '평가': 'bg-orange-50 border-orange-200 text-orange-700',
                        }
                        const colorClass = typeColors[type] || 'bg-gray-50 border-gray-200 text-gray-700'
                        
                        return (
                          <div key={subIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start gap-3 mb-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass} border`}>
                                {type}
                              </span>
                              {duration && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  ⏱️ {duration}분
                                </span>
                              )}
                            </div>
                            
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {title}
                            </h4>
                            
                            {description && (
                              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                                {description}
                              </p>
                            )}
                            
                            {materials && materials.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                  📦 필요 자료
                                </p>
                                <ul className="space-y-1">
                                  {materials.map((material: any, mIndex: number) => (
                                    <li key={mIndex} className="text-xs text-gray-600 flex items-start gap-1.5">
                                      <span className="text-cobalt-500 mt-0.5">•</span>
                                      <span>{typeof material === 'string' ? material : JSON.stringify(material)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                }
                
                // activity가 단일 객체인 경우
                const title = activity.title || activity.session || activity.name || `차시 ${index + 1}`
                let content = activity.description || activity.content || activity.activities || activity.activity || ''
                
                // content가 객체/배열이면 문자열로 변환
                if (typeof content !== 'string') {
                  content = JSON.stringify(content, null, 2)
                }
                
                const duration = activity.duration
                const objectives = activity.objectives
                
                return (
                  <div key={index} className="border-l-4 border-cobalt-500 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {index + 1}차시: {title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-2">
                      {content}
                    </p>
                    
                    {duration && (
                      <div className="mt-2 text-sm text-gray-600">
                        ⏱️ {duration}분
                      </div>
                    )}
                    {objectives && (
                      <div className="mt-2 text-sm text-gray-600">
                        🎯 목표: {Array.isArray(objectives) ? objectives.join(', ') : objectives}
                      </div>
                    )}
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

        {/* AI 생성 정보 */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <div>
              AI 모델: <span className="font-mono">{course.ai_model_used}</span>
            </div>
            <div>
              생성 시간: {course.generation_time_ms ? `${(course.generation_time_ms / 1000).toFixed(2)}초` : '알 수 없음'}
            </div>
          </div>
        </div>

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
