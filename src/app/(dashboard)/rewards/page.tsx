'use client'

import { useState, useEffect } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged, User } from 'firebase/auth'

interface Contributor {
  userId: string
  userName: string
  totalMaterials: number
  totalReferences: number
  totalCitations: number
  totalDownloads: number
  averageSatisfaction: number
  contributionScore: number
  rank: number
}

interface RewardTier {
  rank: number
  title: string
  pointsMultiplier: number
  benefits: string[]
}

export default function RewardsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [topContributors, setTopContributors] = useState<Contributor[]>([])
  const [myStats, setMyStats] = useState<Contributor | null>(null)
  const [tiers, setTiers] = useState<RewardTier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        fetchMyStats(currentUser)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    fetchTopContributors()
  }, [])

  const fetchTopContributors = async () => {
    try {
      const res = await fetch('/api/reward/contributors?action=top&limit=10')
      if (res.ok) {
        const data = await res.json()
        setTopContributors(data.contributors || [])
        setTiers(data.tiers || [])
      }
    } catch (error) {
      console.error('기여자 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyStats = async (currentUser: User) => {
    try {
      const token = await currentUser.getIdToken()
      const res = await fetch('/api/reward/contributors?action=my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMyStats(data.stats)
      }
    } catch (error) {
      console.error('내 통계 로드 오류:', error)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '⭐'
    return '🔹'
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">리워드</h1>
        <p className="text-gray-600">기여도에 따른 리워드를 확인하세요</p>
      </div>

      {/* 내 통계 */}
      {user && myStats && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">내 기여 현황</h2>
            <span className="text-3xl">{getRankBadge(myStats.rank)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-100 text-sm">순위</p>
              <p className="text-2xl font-bold">{myStats.rank}위</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">기여 점수</p>
              <p className="text-2xl font-bold">{myStats.contributionScore.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">등록 자료</p>
              <p className="text-2xl font-bold">{myStats.totalMaterials}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">총 인용</p>
              <p className="text-2xl font-bold">{myStats.totalCitations}</p>
            </div>
          </div>
        </div>
      )}

      {/* 리워드 티어 설명 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">리워드 등급</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.rank}
              className="p-4 rounded-xl bg-gray-50 border border-gray-100"
            >
              <div className="text-xl mb-2">{tier.title}</div>
              <p className="text-sm text-gray-600 mb-3">
                상위 {tier.rank}위 이내
              </p>
              <ul className="space-y-1">
                {tier.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                    <span>✓</span> {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 상위 기여자 랭킹 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">이달의 기여자 TOP 10</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : topContributors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-600">아직 기여자가 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">자료를 업로드하고 첫 번째 기여자가 되어보세요!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 pl-2">순위</th>
                  <th className="pb-3">기여자</th>
                  <th className="pb-3 text-center">자료 수</th>
                  <th className="pb-3 text-center">인용</th>
                  <th className="pb-3 text-center">다운로드</th>
                  <th className="pb-3 text-right pr-2">점수</th>
                </tr>
              </thead>
              <tbody>
                {topContributors.map((contributor) => (
                  <tr
                    key={contributor.userId}
                    className={`border-b last:border-0 ${
                      user?.uid === contributor.userId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-4 pl-2">
                      <span className="text-xl">{getRankBadge(contributor.rank)}</span>
                      <span className="ml-2 font-medium">{contributor.rank}</span>
                    </td>
                    <td className="py-4">
                      <span className="font-medium text-gray-900">
                        {contributor.userName}
                      </span>
                      {user?.uid === contributor.userId && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          나
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center text-gray-600">
                      {contributor.totalMaterials}
                    </td>
                    <td className="py-4 text-center text-gray-600">
                      {contributor.totalCitations}
                    </td>
                    <td className="py-4 text-center text-gray-600">
                      {contributor.totalDownloads}
                    </td>
                    <td className="py-4 text-right pr-2 font-semibold text-blue-600">
                      {contributor.contributionScore.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 기여 안내 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
        <h3 className="font-semibold text-gray-900 mb-2">💡 기여 점수 계산 방식</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-medium text-gray-900">인용 1회</p>
            <p className="text-amber-600 font-bold">+10점</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-medium text-gray-900">참조 1회</p>
            <p className="text-amber-600 font-bold">+5점</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-medium text-gray-900">다운로드 1회</p>
            <p className="text-amber-600 font-bold">+3점</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-medium text-gray-900">자료 등록</p>
            <p className="text-amber-600 font-bold">+5점</p>
          </div>
        </div>
      </div>
    </div>
  )
}
