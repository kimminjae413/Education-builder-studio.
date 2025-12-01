// src/components/admin/RankDistribution.tsx
'use client'

interface RankDistributionProps {
  counts: {
    newcomer: number
    junior: number
    intermediate: number
    senior: number
    veteran: number
    master: number
  }
}

export function RankDistribution({ counts }: RankDistributionProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  const ranks = [
    { key: 'newcomer', label: '새싹', emoji: '🌱', color: 'bg-green-500' },
    { key: 'junior', label: '초급', emoji: '📘', color: 'bg-blue-500' },
    { key: 'intermediate', label: '중급', emoji: '📗', color: 'bg-teal-500' },
    { key: 'senior', label: '고급', emoji: '📕', color: 'bg-orange-500' },
    { key: 'veteran', label: '베테랑', emoji: '🏆', color: 'bg-purple-500' },
    { key: 'master', label: '마스터', emoji: '💎', color: 'bg-yellow-500' },
  ]

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">랭크 분포</h2>

      {/* 그리드 형태 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {ranks.map((rank) => {
          const count = counts[rank.key as keyof typeof counts]
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0

          return (
            <div
              key={rank.key}
              className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
            >
              <div className="text-3xl mb-2">{rank.emoji}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {count}
              </div>
              <div className="text-sm text-gray-600 mb-1">{rank.label}</div>
              <div className="text-xs text-gray-500">{percentage}%</div>
            </div>
          )
        })}
      </div>

      {/* 바 차트 */}
      <div className="space-y-3">
        {ranks.map((rank) => {
          const count = counts[rank.key as keyof typeof counts]
          const percentage = total > 0 ? (count / total) * 100 : 0

          return (
            <div key={rank.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {rank.emoji} {rank.label}
                </span>
                <span className="text-gray-500">
                  {count}명 ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${rank.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* 총계 */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">전체</span>
          <span className="text-lg font-bold text-cobalt-600">
            {total.toLocaleString()}명
          </span>
        </div>
      </div>
    </div>
  )
}
