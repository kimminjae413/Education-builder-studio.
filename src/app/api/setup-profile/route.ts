// src/app/api/setup-profile/route.ts
// 프로필 직접 추가 API (Firebase Admin 없이)

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { uid, email, role, secretKey } = body

    // 보안: 시크릿 키 확인
    if (secretKey !== 'edubuilder-profile-setup-2026') {
      return NextResponse.json({ error: 'Invalid secret key' }, { status: 403 })
    }

    if (!uid || !email) {
      return NextResponse.json({ error: 'uid and email required' }, { status: 400 })
    }

    // profiles 테이블에 추가/업데이트
    await query(
      `INSERT INTO profiles (id, email, role, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         role = EXCLUDED.role,
         email = EXCLUDED.email,
         updated_at = NOW()`,
      [uid, email, role || 'instructor', email.split('@')[0]]
    )

    console.log('✅ 프로필 추가/업데이트:', { uid, email, role })

    return NextResponse.json({
      success: true,
      message: 'Profile created/updated',
      uid,
      email,
      role: role || 'instructor',
    })
  } catch (error: any) {
    console.error('❌ 프로필 생성 오류:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}
