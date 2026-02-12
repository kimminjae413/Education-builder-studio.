// src/app/api/setup-chunks-table/route.ts
// document_chunks 테이블 생성 API

import { NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET() {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    // 1. pgvector 확장 활성화 시도
    try {
      await query('CREATE EXTENSION IF NOT EXISTS vector')
      console.log('✅ pgvector extension enabled')
    } catch (e: any) {
      console.log('⚠️ pgvector extension not available:', e.message)
      // Cloud SQL에서는 pgvector가 없을 수 있음 - 일반 배열로 대체
    }

    // 2. document_chunks 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES teaching_materials(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        token_count INTEGER NOT NULL DEFAULT 0,
        embedding DOUBLE PRECISION[] DEFAULT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
      )
    `)
    console.log('✅ document_chunks table created')

    // 3. 인덱스 생성
    await query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_document
      ON document_chunks(document_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_created
      ON document_chunks(created_at DESC)
    `)

    // 4. rag_citations 테이블 생성 (RAG 인용 추적용)
    await query(`
      CREATE TABLE IF NOT EXISTS rag_citations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
        document_id UUID NOT NULL REFERENCES teaching_materials(id) ON DELETE CASCADE,
        relevance_score NUMERIC(5,4) DEFAULT 0,
        cited_in_output BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ rag_citations table created')

    // 5. 인용 테이블 인덱스
    await query(`
      CREATE INDEX IF NOT EXISTS idx_citations_document
      ON rag_citations(document_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_citations_course
      ON rag_citations(course_id)
    `)

    // 6. teaching_materials 테이블에 청킹 관련 컬럼 추가
    const alterQueries = [
      `ALTER TABLE teaching_materials ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0`,
      `ALTER TABLE teaching_materials ADD COLUMN IF NOT EXISTS chunking_status TEXT DEFAULT 'pending'`,
      `ALTER TABLE teaching_materials ADD COLUMN IF NOT EXISTS reference_count INTEGER DEFAULT 0`,
      `ALTER TABLE teaching_materials ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0`,
      `ALTER TABLE teaching_materials ADD COLUMN IF NOT EXISTS content_type TEXT`,
      `ALTER TABLE teaching_materials ADD COLUMN IF NOT EXISTS auto_category TEXT`,
      `ALTER TABLE teaching_materials ADD COLUMN IF NOT EXISTS auto_tags TEXT[] DEFAULT '{}'`,
    ]

    for (const q of alterQueries) {
      try {
        await query(q)
      } catch (e: any) {
        // 컬럼이 이미 있으면 무시
        if (!e.message.includes('already exists')) {
          console.error('ALTER error:', e.message)
        }
      }
    }
    console.log('✅ teaching_materials columns added')

    // 7. 테이블 확인
    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    // 8. document_chunks 컬럼 확인
    const columns = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'document_chunks'
      ORDER BY ordinal_position
    `)

    return NextResponse.json({
      success: true,
      message: 'RAG tables created successfully',
      tables: tables.rows.map((r: any) => r.table_name),
      document_chunks_columns: columns.rows,
    })
  } catch (error: any) {
    console.error('Setup chunks table error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
