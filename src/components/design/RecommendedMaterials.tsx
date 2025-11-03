// src/components/design/RecommendedMaterials.tsx
'use client'

export function RecommendedMaterials({ courseId }: { courseId: string }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-8">
      <div className="text-center py-8">
        <p className="text-gray-600">추천 자료 기능 개발 중입니다.</p>
        <p className="text-sm text-gray-500 mt-2">Course ID: {courseId}</p>
      </div>
    </div>
  )
}
