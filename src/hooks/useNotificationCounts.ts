// src/hooks/useNotificationCounts.ts
// 통합 알림 카운트 폴링 훅 (메시지, 공지사항, 1:1 문의)

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged } from 'firebase/auth'

interface NotificationCounts {
  messages: number
  announcements: number
  inquiries: number
}

export function useNotificationCounts(): NotificationCounts {
  const [counts, setCounts] = useState<NotificationCounts>({
    messages: 0,
    announcements: 0,
    inquiries: 0,
  })

  const fetchCounts = useCallback(async () => {
    try {
      const auth = getFirebaseAuth()
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const res = await fetch('/api/notifications/counts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCounts({
          messages: data.messages || 0,
          announcements: data.announcements || 0,
          inquiries: data.inquiries || 0,
        })
      }
    } catch {
      // 조용히 실패
    }
  }, [])

  useEffect(() => {
    const auth = getFirebaseAuth()
    let interval: ReturnType<typeof setInterval> | null = null

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCounts()
        interval = setInterval(fetchCounts, 60000)
      } else {
        setCounts({ messages: 0, announcements: 0, inquiries: 0 })
        if (interval) clearInterval(interval)
      }
    })

    return () => {
      unsubscribe()
      if (interval) clearInterval(interval)
    }
  }, [fetchCounts])

  return counts
}
