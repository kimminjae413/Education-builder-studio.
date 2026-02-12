import { NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET() {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    // profiles 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        bio TEXT,
        profile_image_url TEXT,
        role VARCHAR(50) DEFAULT 'user',
        rank VARCHAR(50) DEFAULT 'newcomer',
        points INTEGER DEFAULT 0,
        ai_usage_count_this_month INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // profile_image_url 컬럼 추가 (기존 테이블 마이그레이션용)
    await query(`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS profile_image_url TEXT
    `).catch(() => {})

    // teaching_materials 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS teaching_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES profiles(id),
        filename VARCHAR(500) NOT NULL,
        file_url TEXT NOT NULL,
        gcs_path TEXT,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        content_text TEXT,
        target_category VARCHAR(100),
        subject_category VARCHAR(100),
        tool_categories TEXT[] DEFAULT '{}',
        method_categories TEXT[] DEFAULT '{}',
        difficulty VARCHAR(50) DEFAULT 'medium',
        learning_objectives TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        is_seed_data BOOLEAN DEFAULT FALSE,
        indexed BOOLEAN DEFAULT FALSE,
        usage_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        bookmark_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        seed_approved_at TIMESTAMP WITH TIME ZONE,
        seed_approved_by VARCHAR(255),
        review_note TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // courses 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES profiles(id),
        title VARCHAR(500) NOT NULL,
        target_audience VARCHAR(255),
        subject VARCHAR(255),
        tools TEXT[] DEFAULT '{}',
        duration INTEGER,
        session_count INTEGER,
        knowledge_goals TEXT[] DEFAULT '{}',
        skill_goals TEXT[] DEFAULT '{}',
        attitude_goals TEXT[] DEFAULT '{}',
        lecture_ratio INTEGER DEFAULT 0,
        practice_ratio INTEGER DEFAULT 0,
        project_ratio INTEGER DEFAULT 0,
        ai_generated_content JSONB DEFAULT '{}',
        lesson_plan TEXT,
        activities JSONB DEFAULT '[]',
        materials_needed TEXT[] DEFAULT '{}',
        ai_model_used VARCHAR(100),
        ai_prompt_used TEXT,
        generation_time_ms INTEGER,
        status VARCHAR(50) DEFAULT 'completed',
        recommended_materials TEXT[] DEFAULT '{}',
        views_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // 테이블 확인
    const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      tables: tables.rows.map((r: any) => r.table_name)
    })
  } catch (error: any) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
