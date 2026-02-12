// src/app/api/setup-announcements-inquiries-table/route.ts
// 공지사항 + 문의 테이블 생성 (일회성 설정)

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  // 시크릿 키 검증
  const { secret } = await request.json().catch(() => ({ secret: '' }))
  if (secret !== process.env.SETUP_SECRET && secret !== 'edubuilder-announce-inquiry-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. announcements 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_published BOOLEAN DEFAULT TRUE,
        author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('announcements 테이블 생성')

    // announcements 인덱스
    await query(`CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, is_pinned DESC, created_at DESC)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author_id)`)
    console.log('announcements 인덱스 생성')

    // 1-1. announcement_reads 테이블 (유저별 읽음 시각)
    await query(`
      CREATE TABLE IF NOT EXISTS announcement_reads (
        user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
        last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('announcement_reads 테이블 생성')

    // 2. inquiries 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('inquiries 테이블 생성')

    // inquiries 인덱스
    await query(`CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id, created_at DESC)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status, created_at DESC)`)
    console.log('inquiries 인덱스 생성')

    // 3. inquiry_replies 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS inquiry_replies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('inquiry_replies 테이블 생성')

    // inquiry_replies 인덱스
    await query(`CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry ON inquiry_replies(inquiry_id, created_at ASC)`)
    console.log('inquiry_replies 인덱스 생성')

    // 테이블 확인
    const tables = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('announcements', 'announcement_reads', 'inquiries', 'inquiry_replies')
      ORDER BY table_name
    `)

    return NextResponse.json({
      success: true,
      message: 'Announcements & Inquiries tables created successfully',
      tables: tables.rows.map((r: any) => r.table_name),
    })
  } catch (error: unknown) {
    console.error('테이블 생성 오류:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
