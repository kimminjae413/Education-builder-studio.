// src/app/api/setup-messages-table/route.ts
// 메시지 테이블 생성 (일회성 설정)

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  // 시크릿 키 검증
  const { secret } = await request.json().catch(() => ({ secret: '' }))
  if (secret !== process.env.SETUP_SECRET && secret !== 'edubuilder-msg-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 0. profiles 테이블 컬럼 확인 (메시지 기능에 필요)
    await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT`).catch(() => {})
    await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank VARCHAR(50) DEFAULT 'newcomer'`).catch(() => {})
    console.log('✅ profiles 컬럼 확인')

    // 1. conversations 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_1 TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        participant_2 TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_preview TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2),
        CONSTRAINT ordered_participants CHECK (participant_1 < participant_2)
      )
    `)
    console.log('✅ conversations 테이블 생성')

    // conversations 인덱스
    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant_1)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant_2)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC)`)
    console.log('✅ conversations 인덱스 생성')

    // 2. messages 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ messages 테이블 생성')

    // messages 인덱스
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE`)
    console.log('✅ messages 인덱스 생성')

    // 테이블 확인
    const tables = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('conversations', 'messages')
      ORDER BY table_name
    `)

    return NextResponse.json({
      success: true,
      message: 'Messages tables created successfully',
      tables: tables.rows.map((r: any) => r.table_name),
    })
  } catch (error: unknown) {
    console.error('❌ 메시지 테이블 생성 오류:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
