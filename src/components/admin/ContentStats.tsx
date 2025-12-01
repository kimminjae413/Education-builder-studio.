// src/components/admin/ContentStats.tsx
'use client'

interface ContentStatsProps {
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export function ContentStats({ stats }: ContentStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* 전체 콘텐츠 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-sm text-gray-600 mb-1">전체 콘텐츠</div>
        <div className="text-3xl font-bold text-gray-900">
          {stats.total}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          모든 상태 포함
        </div>
      </div>

      {/* 승인 대기 */}
      <div className="bg-white rounded-xl p-6 border border-amber-200 bg-amber-50">
        <div className="text-sm text-amber-700 mb-1">승인 대기</div>
        <div className="text-3xl font-bold text-amber-900">
          {stats.pending}
        </div>
        <div className="text-xs text-amber-600 mt-1">
          ⏳ 검토 필요
        </div>
      </div>

      {/* 승인됨 */}
      <div className="bg-white rounded-xl p-6 border border-green-200 bg-green-50">
        <div className="text-sm text-green-700 mb-1">승인됨</div>
        <div className="text-3xl font-bold text-green-900">
          {stats.approved}
        </div>
        <div className="text-xs text-green-600 mt-1">
          ✅ 공개 중
        </div>
      </div>

      {/* 거부됨 */}
      <div className="bg-white rounded-xl p-6 border border-red-200 bg-red-50">
        <div className="text-sm text-red-700 mb-1">거부됨</div>
        <div className="text-3xl font-bold text-red-900">
          {stats.rejected}
        </div>
        <div className="text-xs text-red-600 mt-1">
          ❌ 비공개
        </div>
      </div>
    </div>
  )
}
