// 최초 관리자 설정용 API (설정 후 삭제 권장)
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'setup-admin-2026'

export async function POST(request: NextRequest) {
  try {
    const { email, setupKey } = await request.json()

    // 보안 키 확인
    if (setupKey !== ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // 이메일로 프로필 찾아서 admin으로 설정
    const result = await query(
      `UPDATE profiles SET role = 'admin', updated_at = NOW() WHERE email = $1 RETURNING id, email, role`,
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    })
  } catch (error: any) {
    console.error('Admin setup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
