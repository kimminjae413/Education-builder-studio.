// src/app/api/setup-admin/route.ts
// 관리자 계정 생성 API (일회성)

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin'
import { query } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { email, password, secretKey } = body

    // 보안: 간단한 시크릿 키 확인
    if (secretKey !== 'edubuilder-admin-setup-2026') {
      return NextResponse.json({ error: 'Invalid secret key' }, { status: 403 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    let user
    let isNew = false

    // 기존 사용자 확인
    try {
      user = await getAdminAuth().getUserByEmail(email)
      console.log('기존 계정 발견:', user.uid)
      // 비밀번호 업데이트
      await getAdminAuth().updateUser(user.uid, { password })
      console.log('비밀번호 업데이트 완료')
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // 새 사용자 생성
        user = await getAdminAuth().createUser({
          email,
          password,
          emailVerified: true,
        })
        console.log('새 계정 생성:', user.uid)
        isNew = true
      } else {
        throw e
      }
    }

    // profiles 테이블에 admin으로 추가/업데이트
    await query(
      `INSERT INTO profiles (id, email, role, name)
       VALUES ($1, $2, 'admin', $3)
       ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW()`,
      [user.uid, email, email.split('@')[0]]
    )

    console.log('✅ 관리자 권한 부여 완료:', email)

    return NextResponse.json({
      success: true,
      message: isNew ? 'Admin account created' : 'Admin account updated',
      uid: user.uid,
      email: user.email,
    })
  } catch (error: any) {
    console.error('❌ 관리자 생성 오류:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}
