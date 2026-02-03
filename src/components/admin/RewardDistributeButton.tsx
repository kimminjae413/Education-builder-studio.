// src/components/admin/RewardDistributeButton.tsx
'use client'

import { useState } from 'react'
import { Gift } from 'lucide-react'

export function RewardDistributeButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleDistribute = async () => {
    if (!confirm('이번 달 리워드를 분배하시겠습니까?\n\n상위 10명에게 포인트가 지급됩니다.')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/reward/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `리워드 분배 완료! 총 ${data.totalDistributed?.toLocaleString() || 0}P 분배됨`,
        })
        // 페이지 새로고침
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setResult({
          success: false,
          message: data.error || '분배 실패',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: '네트워크 오류가 발생했습니다',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </span>
      )}
      <button
        onClick={handleDistribute}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Gift className="w-4 h-4" />
        {loading ? '분배 중...' : '리워드 분배'}
      </button>
    </div>
  )
}
