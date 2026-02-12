// src/app/api/setup-feedback-table/route.ts
// 피드백 테이블 생성 (일회성 설정)

import { NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function POST() {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    // course_feedbacks 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS course_feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        useful_sections JSONB DEFAULT '[]',
        improvement_areas JSONB DEFAULT '[]',
        selected_type TEXT,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // 인덱스 생성
    await query(`
      CREATE INDEX IF NOT EXISTS idx_feedbacks_course ON course_feedbacks(course_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON course_feedbacks(user_id)
    `)

    // courses 테이블에 평점 컬럼 추가
    await query(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1),
      ADD COLUMN IF NOT EXISTS feedback_count INTEGER DEFAULT 0
    `)

    // teaching_materials 테이블에 자동 분류 컬럼 추가
    await query(`
      ALTER TABLE teaching_materials
      ADD COLUMN IF NOT EXISTS auto_main_category TEXT,
      ADD COLUMN IF NOT EXISTS auto_sub_category TEXT,
      ADD COLUMN IF NOT EXISTS auto_content_type TEXT,
      ADD COLUMN IF NOT EXISTS auto_target_grade TEXT,
      ADD COLUMN IF NOT EXISTS auto_difficulty TEXT,
      ADD COLUMN IF NOT EXISTS auto_tags TEXT[],
      ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2)
    `)

    return NextResponse.json({
      success: true,
      message: 'Feedback tables created successfully',
      tables: ['course_feedbacks'],
      columnsAdded: [
        'courses.average_rating',
        'courses.feedback_count',
        'teaching_materials.auto_*',
      ],
    })
  } catch (error: any) {
    console.error('❌ 테이블 생성 오류:', error)
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}
