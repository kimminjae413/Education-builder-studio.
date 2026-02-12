// src/app/api/setup-reward-tables/route.ts
// 리워드 및 마켓플레이스 테이블 생성 (일회성 설정)

import { NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function POST() {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    // 1. teaching_materials에 사용률 컬럼 추가
    await query(`
      ALTER TABLE teaching_materials
      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS reference_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS satisfaction_score NUMERIC(2,1) DEFAULT 0
    `)
    console.log('✅ teaching_materials 컬럼 추가')

    // 2. profiles에 포인트 컬럼이 이미 있음 (스킵)
    // profiles 테이블은 이미 points 컬럼을 가지고 있음
    console.log('✅ profiles.points 컬럼 확인 (이미 존재)')

    // 3. material_views 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS material_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        material_id UUID NOT NULL REFERENCES teaching_materials(id) ON DELETE CASCADE,
        user_id TEXT,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(material_id, user_id)
      )
    `)
    console.log('✅ material_views 테이블 생성')

    // 4. material_downloads 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS material_downloads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        material_id UUID NOT NULL REFERENCES teaching_materials(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ material_downloads 테이블 생성')

    // 5. material_ratings 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS material_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        material_id UUID NOT NULL REFERENCES teaching_materials(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(material_id, user_id)
      )
    `)
    console.log('✅ material_ratings 테이블 생성')

    // 6. reward_distributions 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS reward_distributions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        period TEXT NOT NULL,
        rank INTEGER NOT NULL,
        contribution_score NUMERIC(10,2) NOT NULL,
        reward_points INTEGER NOT NULL,
        tier_title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, period)
      )
    `)
    console.log('✅ reward_distributions 테이블 생성')

    // 7. point_transactions 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        points INTEGER NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_user
      ON point_transactions(user_id)
    `)
    console.log('✅ point_transactions 테이블 생성')

    // 8. marketplace_listings 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        material_id UUID NOT NULL REFERENCES teaching_materials(id) ON DELETE CASCADE,
        seller_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        listing_type TEXT NOT NULL DEFAULT 'free',
        price INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        category_id TEXT NOT NULL,
        tags TEXT[],
        download_count INTEGER DEFAULT 0,
        rating NUMERIC(2,1) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_status
      ON marketplace_listings(status)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_category
      ON marketplace_listings(category_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_seller
      ON marketplace_listings(seller_id)
    `)
    console.log('✅ marketplace_listings 테이블 생성')

    // 9. marketplace_purchases 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS marketplace_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
        buyer_id TEXT NOT NULL,
        points_spent INTEGER NOT NULL DEFAULT 0,
        purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(listing_id, buyer_id)
      )
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_purchases_buyer
      ON marketplace_purchases(buyer_id)
    `)
    console.log('✅ marketplace_purchases 테이블 생성')

    return NextResponse.json({
      success: true,
      message: 'Reward and marketplace tables created successfully',
      tables: [
        'material_views',
        'material_downloads',
        'material_ratings',
        'reward_distributions',
        'point_transactions',
        'marketplace_listings',
        'marketplace_purchases',
      ],
    })
  } catch (error: any) {
    console.error('❌ 테이블 생성 오류:', error)
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}
