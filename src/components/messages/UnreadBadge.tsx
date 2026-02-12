// src/components/messages/UnreadBadge.tsx
'use client'

import { useState, useEffect } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { onAuthStateChanged } from 'firebase/auth'

export function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUnreadCount()
        // 60초마다 폴링
        const interval = setInterval(fetchUnreadCount, 60000)
        return () => clearInterval(interval)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchUnreadCount = async () => {
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
  }

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
      {count > 9 ? '9+' : count}
    </span>
  )
}
