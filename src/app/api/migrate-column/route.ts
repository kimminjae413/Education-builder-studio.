// 일회성 마이그레이션 API - vertex_indexed → indexed 컬럼명 변경
// 실행 후 이 파일 삭제할 것

import { NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET() {
  try {
    console.log('🔄 컬럼명 마이그레이션 시작...')

    // 1. 기존 컬럼 존재 확인
    const checkOld = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'teaching_materials' AND column_name = 'vertex_indexed'
    `)

    if (checkOld.rows.length === 0) {
      // 이미 변경되었거나 컬럼이 없음
      const checkNew = await query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'teaching_materials' AND column_name = 'indexed'
      `)

      if (checkNew.rows.length > 0) {
        return NextResponse.json({
          success: true,
          message: '이미 마이그레이션 완료됨 (indexed 컬럼 존재)',
        })
      }

      // 컬럼이 아예 없으면 새로 생성
      await query(`
        ALTER TABLE teaching_materials
        ADD COLUMN IF NOT EXISTS indexed BOOLEAN DEFAULT FALSE
      `)

      return NextResponse.json({
        success: true,
        message: 'indexed 컬럼 새로 생성됨',
      })
    }

    // 2. 컬럼명 변경
    await query(`
      ALTER TABLE teaching_materials
      RENAME COLUMN vertex_indexed TO indexed
    `)
    console.log('✅ 컬럼명 변경 완료: vertex_indexed → indexed')

    // 3. 기존 인덱스 삭제
    try {
      await query(`DROP INDEX IF EXISTS idx_materials_vertex_pending`)
      console.log('✅ 기존 인덱스 삭제 완료')
    } catch (e) {
      console.log('⚠️ 기존 인덱스 없음 (정상)')
    }

    // 4. 새 인덱스 생성
    await query(`
      CREATE INDEX IF NOT EXISTS idx_materials_indexing_pending
      ON teaching_materials (indexed)
      WHERE indexed = FALSE AND is_seed_data = TRUE AND status = 'approved'
    `)
    console.log('✅ 새 인덱스 생성 완료')

    // 5. 확인
    const verify = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'teaching_materials' AND column_name = 'indexed'
    `)

    return NextResponse.json({
      success: true,
      message: '마이그레이션 완료! vertex_indexed → indexed',
      verified: verify.rows.length > 0,
    })
  } catch (error: any) {
    console.error('❌ 마이그레이션 에러:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
