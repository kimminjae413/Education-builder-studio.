// src/app/api/users/search/route.ts
// 유저 검색 API (자동완성용)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { searchUsers } from '@/lib/db/messages'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''

    // 최소 2글자 이상
    if (q.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
      })
    }

    const users = await searchUsers(q, user.uid)

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error: unknown) {
    console.error('유저 검색 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
