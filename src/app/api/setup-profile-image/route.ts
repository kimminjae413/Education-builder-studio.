// src/app/api/setup-profile-image/route.ts
// profiles 테이블에 profile_image_url 컬럼 추가

import { NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET() {
  try {
    // profile_image_url 컬럼이 없으면 추가
    await query(`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS profile_image_url TEXT
    `)

    return NextResponse.json({
      success: true,
      message: 'profile_image_url 컬럼이 추가되었습니다'
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
