// src/hooks/useUnreadCount.ts
// 안읽은 메시지 수 폴링 훅

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged } from 'firebase/auth'

export function useUnreadCount() {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const auth = getFirebaseAuth()
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const res = await fetch('/api/messages/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCount(data.count || 0)
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
        fetchCount()
        interval = setInterval(fetchCount, 60000)
      } else {
        setCount(0)
        if (interval) clearInterval(interval)
      }
    })

    return () => {
      unsubscribe()
      if (interval) clearInterval(interval)
    }
  }, [fetchCount])

  return count
}
