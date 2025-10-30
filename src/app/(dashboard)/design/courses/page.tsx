// src/app/(dashboard)/design/courses/page.tsx (새 파일)

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, BookOpen, Calendar, Eye, Plus, ArrowLeft } from 'lucide-react'

export default async function MyCoursesPage() {
  const supabase = await createClient()
  
  // 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  // 내가 만든 과정 불러오기
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/design"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  내가 만든 교육과정
                </h1>
              </div>
              <p className="text-gray-600">
                AI로 생성한 교육과정을 확인하고 관리하세요
              </p>
            </div>
            <Link
              href="/design"
              className="flex items-center gap-2 px-4 py-2 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              새 과정 만들기
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!courses || courses.length === 0 ? (
          // 빈 상태
          <div className="bg-white rounded-lg border p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              아직 만든 과정이 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              AI 설계 마법사로 첫 교육과정을 만들어보세요!
            </p>
            <Link
              href="/design"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cobalt-600 text-white rounded-lg hover:bg-cobalt-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              첫 과정 만들기
            </Link>
          </div>
        ) : (
          // 과정 목록
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/design/courses/${course.id}`}
                className="bg-white rounded-lg border hover:border-cobalt-500 hover:shadow-md transition-all"
              >
                <div className="p-6">
                  {/* 제목 */}
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">
                    {course.title}
                  </h3>
                  
                  {/* 설명 */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {course.lesson_plan || course.ai_generated_content?.overview || '과정 설명이 없습니다'}
                  </p>
                  
                  {/* 메타 정보 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{course.session_count}차시</span>
                      <span className="text-gray-300">•</span>
                      <Clock className="h-3.5 w-3.5" />
                      <span>{course.duration}분</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(course.created_at).toLocaleDateString('ko-KR')}</span>
                      <span className="text-gray-300">•</span>
                      <Eye className="h-3.5 w-3.5" />
                      <span>조회 {course.views_count || 0}</span>
                    </div>
                  </div>
                  
                  {/* 태그 */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 bg-cobalt-50 text-cobalt-700 rounded text-xs">
                      {course.subject}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {course.target_audience}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* 통계 (선택사항) */}
        {courses && courses.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-cobalt-600">
                {courses.length}
              </div>
              <div className="text-sm text-gray-600">총 과정</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {courses.reduce((sum, c) => sum + (c.views_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">총 조회수</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {courses.reduce((sum, c) => sum + (c.session_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">총 차시</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
