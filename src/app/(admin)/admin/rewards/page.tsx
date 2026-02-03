// src/app/(admin)/admin/rewards/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile } from '@/lib/db/queries'
import { getTopContributors } from '@/lib/reward/usage-tracker'
import { getCurrentMonth, REWARD_TIERS, getRewardTier, calculateRewardPoints } from '@/lib/reward/reward-system'
import { RewardDistributeButton } from '@/components/admin/RewardDistributeButton'

export default async function AdminRewardsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }
  const user = await verifyIdToken(token)

  // 관리자 권한 확인
  const profile = await getProfile(user.uid)
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 상위 기여자 조회
  const contributors = await getTopContributors(10)
  const currentMonth = getCurrentMonth()

  // 예상 리워드 계산
  const contributorsWithRewards = contributors.map(c => ({
    ...c,
    tier: getRewardTier(c.rank),
    expectedReward: calculateRewardPoints(c.contributionScore, c.rank),
  }))

  const totalExpectedReward = contributorsWithRewards.reduce(
    (sum, c) => sum + c.expectedReward, 0
  )

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">리워드 관리</h1>
        <p className="text-gray-600 mt-1">
          월간 기여자 리워드를 관리하고 분배합니다
        </p>
      </div>

      {/* 안내 박스 */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <span>💰</span> 리워드 시스템 안내
        </h3>
        <div className="space-y-3 text-sm text-green-800">
          <p>
            매월 상위 10명의 기여자에게 자동으로 리워드 포인트가 분배됩니다.
            기여 점수는 자료 조회, 다운로드, 인용 횟수에 따라 계산됩니다.
          </p>
          <div className="bg-white/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">1.</span>
              <span><strong>인용 (Citation)</strong>: AI가 자료를 참고하면 +10점</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">2.</span>
              <span><strong>참조 (Reference)</strong>: 검색 결과에 노출되면 +5점</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">3.</span>
              <span><strong>다운로드</strong>: 다른 사용자가 다운로드하면 +3점</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">4.</span>
              <span><strong>조회</strong>: 자료가 조회되면 +1점</span>
            </div>
          </div>
        </div>
      </div>

      {/* 리워드 티어 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">리워드 티어</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {REWARD_TIERS.map((tier) => (
            <div
              key={tier.rank}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-lg font-bold mb-2">{tier.title}</div>
              <div className="text-sm text-gray-600 mb-2">
                {tier.rank <= 3 ? `${tier.rank}위` : `4-10위`}
              </div>
              <div className="text-cobalt-600 font-semibold mb-3">
                x{tier.pointsMultiplier} 보너스
              </div>
              <ul className="text-xs text-gray-500 space-y-1">
                {tier.benefits.map((benefit, i) => (
                  <li key={i}>• {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 현재 월 기여자 순위 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentMonth} 기여자 순위
            </h2>
            <p className="text-sm text-gray-500">
              예상 총 분배 포인트: <span className="font-bold text-green-600">{totalExpectedReward.toLocaleString()}P</span>
            </p>
          </div>
          <RewardDistributeButton />
        </div>

        {contributorsWithRewards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>아직 기여 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">순위</th>
                  <th className="pb-3 font-medium">사용자</th>
                  <th className="pb-3 font-medium text-right">자료 수</th>
                  <th className="pb-3 font-medium text-right">참조</th>
                  <th className="pb-3 font-medium text-right">다운로드</th>
                  <th className="pb-3 font-medium text-right">인용</th>
                  <th className="pb-3 font-medium text-right">기여 점수</th>
                  <th className="pb-3 font-medium text-right">예상 리워드</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contributorsWithRewards.map((contributor) => (
                  <tr key={contributor.userId} className="hover:bg-gray-50">
                    <td className="py-3">
                      <span className={`
                        inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                        ${contributor.rank === 1 ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${contributor.rank === 2 ? 'bg-gray-100 text-gray-700' : ''}
                        ${contributor.rank === 3 ? 'bg-orange-100 text-orange-700' : ''}
                        ${contributor.rank > 3 ? 'bg-blue-50 text-blue-600' : ''}
                      `}>
                        {contributor.rank}
                      </span>
                    </td>
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {contributor.userName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contributor.tier.title}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {contributor.totalMaterials}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {contributor.totalReferences.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {contributor.totalDownloads.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {contributor.totalCitations.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-semibold text-cobalt-600">
                      {contributor.contributionScore.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-bold text-green-600">
                      {contributor.expectedReward.toLocaleString()}P
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
