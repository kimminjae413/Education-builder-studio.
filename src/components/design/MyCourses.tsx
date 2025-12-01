// src/components/design/MyCourses.tsx
'use client'

import Link from 'next/link'
import { Clock, Calendar, Eye } from 'lucide-react'

interface Course {
  id: string
  title: string
  target_audience: string
  subject: string
  duration: number
  session_count: number
  created_at: string
  views_count: number
}

interface MyCoursesProps {
  courses: Course[]
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          최근 생성한 과정 ({courses.length})
        </h3>
        {courses.length > 5 && (
          <Link
            href="/design/courses"
            className="text-sm text-cobalt-600 hover:underline"
          >
            전체 보기
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/design/courses/${course.id}`}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-cobalt-300 hover:shadow-md transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
              {course.title}
            </h4>
            
            <p className="text-sm text-gray-600 mb-3">
              {course.target_audience} · {course.subject}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.duration}분 × {course.session_count}차시
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {course.views_count}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(course.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
