// src/components/profile/ProfileStats.tsx
import { RANK_INFO, InstructorRank } from '@/lib/rank/types'
import { FileText, Download, Star, Sparkles } from 'lucide-react'

interface ProfileStatsProps {
  profile: {
    rank: InstructorRank
  }
  stats: {
    materialCount: number
    totalDownloads: number
    avgRating: number
    aiUsageThisMonth: number
  }
}

export function ProfileStats({ profile, stats }: ProfileStatsProps) {
  const rankInfo = RANK_INFO[profile.rank]
  const aiLimit = rankInfo.aiLimit
  const aiUsagePercent = aiLimit ? (stats.aiUsageThisMonth / aiLimit) * 100 : 0

  return (
    <div className="space-y-4">
      {/* 활동 통계 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">활동 통계</h3>
        
        <div className="space-y-4">
          {/* 콘텐츠 수 */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-cobalt-50 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-cobalt-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600">업로드한 콘텐츠</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.materialCount}
              </p>
            </div>
          </div>

          {/* 다운로드 */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600">총 다운로드</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDownloads}
              </p>
            </div>
          </div>

          {/* 평균 평점 */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
              <Star className="h-6 w-6 text-gold-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600">평균 평점</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI 사용량 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 사용량</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">이번 달 사용</p>
                <p className="text-sm font-semibold text-gray-900">
                  {stats.aiUsageThisMonth} / {aiLimit || '∞'}
                </p>
              </div>
              {aiLimit && (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cobalt-500 transition-all duration-300"
                    style={{ width: `${Math.min(aiUsagePercent, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 경고 메시지 */}
          {aiLimit && aiUsagePercent >= 80 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 leading-relaxed">
                ⚠️ AI 사용량이 {aiUsagePercent.toFixed(0)}%입니다. 
                {aiUsagePercent >= 100 
                  ? ' 이번 달 한도를 모두 사용했습니다.' 
                  : ' 곧 한도에 도달합니다.'}
              </p>
            </div>
          )}

          {/* 무제한 안내 */}
          {!aiLimit && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800">
                ✨ 무제한 사용 가능합니다!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 랭크 혜택 */}
      <div className="bg-gradient-to-br from-cobalt-50 to-purple-50 rounded-2xl border border-cobalt-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>{rankInfo.icon}</span>
          <span>{rankInfo.label} 혜택</span>
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-cobalt-600 font-bold mt-0.5">✓</span>
            <span>AI 설계: <strong>{aiLimit ? `월 ${aiLimit}회` : '무제한'}</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cobalt-600 font-bold mt-0.5">✓</span>
            <span>콘텐츠 업로드: <strong>{rankInfo.uploadLimit ? `${rankInfo.uploadLimit}개` : '무제한'}</strong></span>
          </li>
          {rankInfo.rewardMultiplier > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-gold-500 font-bold mt-0.5">✓</span>
              <span>리워드 배율: <strong>{rankInfo.rewardMultiplier}x</strong></span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
