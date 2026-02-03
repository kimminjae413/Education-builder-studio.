import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { getProfile, createProfile, updateProfile } from '@/lib/db/queries'

// GET: 현재 사용자 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getProfile(user.uid)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 프로필 생성 (회원가입 시)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 이미 프로필이 있는지 확인
    const existingProfile = await getProfile(user.uid)
    if (existingProfile) {
      // 이미 있으면 업데이트
      const body = await request.json()
      const updated = await updateProfile(user.uid, { name: body.name })
      return NextResponse.json(updated)
    }

    // 새 프로필 생성
    const body = await request.json()
    const profile = await createProfile({
      id: user.uid,
      email: user.email || '',
      name: body.name || null,
      role: 'user',
      rank: 'newcomer',
      points: 0,
      ai_usage_count_this_month: 0,
    })

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('POST /api/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: 프로필 업데이트
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const allowedFields = ['name', 'phone', 'bio', 'profile_image_url']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const profile = await updateProfile(user.uid, updates)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('PUT /api/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
