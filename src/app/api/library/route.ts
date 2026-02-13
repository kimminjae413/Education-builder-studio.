// src/app/api/library/route.ts
// 콘텐츠 라이브러리 API - 승인된 teaching_materials 조회

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const searchQuery = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const sortBy = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const conditions: string[] = ["m.status = 'approved'"]
    const values: any[] = []
    let paramIndex = 1

    if (searchQuery) {
      conditions.push(`(m.title ILIKE $${paramIndex} OR m.subject ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex})`)
      values.push(`%${searchQuery}%`)
      paramIndex++
    }

    if (category) {
      conditions.push(`m.subject = $${paramIndex}`)
      values.push(category)
      paramIndex++
    }

    const orderClause = {
      newest: 'm.created_at DESC',
      popular: 'COALESCE(m.download_count, 0) DESC',
      rating: 'COALESCE(m.satisfaction_score, 0) DESC',
      downloads: 'COALESCE(m.download_count, 0) DESC',
    }[sortBy] || 'm.created_at DESC'

    // 총 개수
    const countResult = await query(
      `SELECT COUNT(*) FROM teaching_materials m WHERE ${conditions.join(' AND ')}`,
      values
    )
    const total = parseInt(countResult.rows[0].count)

    // 자료 목록
    const result = await query(
      `SELECT
         m.id,
         m.title,
         m.description,
         m.filename,
         m.subject,
         m.target_audience,
         m.user_id,
         p.name as user_name,
         COALESCE(m.download_count, 0) as download_count,
         COALESCE(m.view_count, 0) as view_count,
         COALESCE(m.satisfaction_score, 0) as rating,
         m.created_at
       FROM teaching_materials m
       LEFT JOIN profiles p ON m.user_id = p.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderClause}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )

    // 카테고리별 개수 (승인된 자료 기준)
    const catResult = await query(
      `SELECT subject, COUNT(*) as count
       FROM teaching_materials
       WHERE status = 'approved' AND subject IS NOT NULL AND subject != ''
       GROUP BY subject
       ORDER BY count DESC`
    )

    const categories = catResult.rows.map(row => ({
      id: row.subject,
      name: row.subject,
      count: parseInt(row.count),
    }))

    return NextResponse.json({
      success: true,
      materials: result.rows,
      categories,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Library API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
