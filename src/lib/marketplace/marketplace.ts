// src/lib/marketplace/marketplace.ts
// 콘텐츠 마켓플레이스 시스템

import { query } from '@/lib/db/client'

export type ListingStatus = 'draft' | 'pending' | 'active' | 'sold' | 'suspended'
export type ListingType = 'free' | 'points' | 'premium'

export interface MarketplaceListing {
  id: string
  materialId: string
  sellerId: string
  sellerName: string
  title: string
  description: string
  previewUrl?: string
  listingType: ListingType
  price: number  // 포인트 가격 (free면 0)
  status: ListingStatus
  categoryId: string
  tags: string[]
  downloadCount: number
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
}

export interface MarketplaceCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
}

export interface MarketplaceSearchParams {
  query?: string
  categoryId?: string
  listingType?: ListingType
  minRating?: number
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_low' | 'price_high'
  page?: number
  limit?: number
}

export interface MarketplacePurchase {
  id: string
  listingId: string
  buyerId: string
  pointsSpent: number
  purchasedAt: Date
}

// 마켓플레이스 카테고리
export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { id: 'coding', name: '코딩/프로그래밍', description: '스크래치, 파이썬, 앱 개발', icon: '💻', count: 0 },
  { id: 'robotics', name: '로봇/하드웨어', description: '아두이노, 마이크로비트, 로봇', icon: '🤖', count: 0 },
  { id: 'ai', name: 'AI/머신러닝', description: '인공지능, 데이터 분석', icon: '🧠', count: 0 },
  { id: 'maker', name: '메이커/공작', description: '3D프린팅, 목공, DIY', icon: '🔧', count: 0 },
  { id: 'science', name: '과학', description: '실험, 탐구 활동', icon: '🔬', count: 0 },
  { id: 'steam', name: 'STEAM 융합', description: '융합 교육, 프로젝트', icon: '🎨', count: 0 },
]

/**
 * 마켓플레이스 리스팅 생성
 */
export async function createListing(data: {
  materialId: string
  sellerId: string
  title: string
  description: string
  listingType: ListingType
  price: number
  categoryId: string
  tags: string[]
}): Promise<{ id: string }> {
  const result = await query(
    `INSERT INTO marketplace_listings
     (material_id, seller_id, title, description, listing_type, price, category_id, tags, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
     RETURNING id`,
    [
      data.materialId,
      data.sellerId,
      data.title,
      data.description,
      data.listingType,
      data.price,
      data.categoryId,
      data.tags,
    ]
  )

  return { id: result.rows[0].id }
}

/**
 * 리스팅 상태 업데이트
 */
export async function updateListingStatus(
  listingId: string,
  status: ListingStatus
): Promise<void> {
  await query(
    `UPDATE marketplace_listings
     SET status = $1, updated_at = NOW()
     WHERE id = $2`,
    [status, listingId]
  )
}

/**
 * 마켓플레이스 검색
 */
export async function searchListings(
  params: MarketplaceSearchParams
): Promise<{ listings: MarketplaceListing[]; total: number }> {
  const {
    query: searchQuery,
    categoryId,
    listingType,
    minRating,
    sortBy = 'newest',
    page = 1,
    limit = 20,
  } = params

  const conditions: string[] = ["status = 'active'"]
  const values: any[] = []
  let paramIndex = 1

  if (searchQuery) {
    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
    values.push(`%${searchQuery}%`)
    paramIndex++
  }

  if (categoryId) {
    conditions.push(`category_id = $${paramIndex}`)
    values.push(categoryId)
    paramIndex++
  }

  if (listingType) {
    conditions.push(`listing_type = $${paramIndex}`)
    values.push(listingType)
    paramIndex++
  }

  if (minRating) {
    conditions.push(`rating >= $${paramIndex}`)
    values.push(minRating)
    paramIndex++
  }

  const orderBy = {
    newest: 'created_at DESC',
    popular: 'download_count DESC',
    rating: 'rating DESC',
    price_low: 'price ASC',
    price_high: 'price DESC',
  }[sortBy]

  const offset = (page - 1) * limit

  // 총 개수 조회
  const countResult = await query(
    `SELECT COUNT(*) FROM marketplace_listings WHERE ${conditions.join(' AND ')}`,
    values
  )
  const total = parseInt(countResult.rows[0].count)

  // 리스팅 조회
  const result = await query(
    `SELECT
       ml.id,
       ml.material_id,
       ml.seller_id,
       u.name as seller_name,
       ml.title,
       ml.description,
       ml.listing_type,
       ml.price,
       ml.status,
       ml.category_id,
       ml.tags,
       ml.download_count,
       ml.rating,
       ml.review_count,
       ml.created_at,
       ml.updated_at
     FROM marketplace_listings ml
     JOIN profiles u ON ml.seller_id = u.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset]
  )

  const listings = result.rows.map(row => ({
    id: row.id,
    materialId: row.material_id,
    sellerId: row.seller_id,
    sellerName: row.seller_name || 'Unknown',
    title: row.title,
    description: row.description,
    listingType: row.listing_type,
    price: row.price,
    status: row.status,
    categoryId: row.category_id,
    tags: row.tags || [],
    downloadCount: row.download_count || 0,
    rating: parseFloat(row.rating) || 0,
    reviewCount: row.review_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return { listings, total }
}

/**
 * 리스팅 상세 조회
 */
export async function getListingDetail(listingId: string): Promise<MarketplaceListing | null> {
  const result = await query(
    `SELECT
       ml.id,
       ml.material_id,
       ml.seller_id,
       u.name as seller_name,
       ml.title,
       ml.description,
       ml.listing_type,
       ml.price,
       ml.status,
       ml.category_id,
       ml.tags,
       ml.download_count,
       ml.rating,
       ml.review_count,
       ml.created_at,
       ml.updated_at
     FROM marketplace_listings ml
     JOIN profiles u ON ml.seller_id = u.id
     WHERE ml.id = $1`,
    [listingId]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    materialId: row.material_id,
    sellerId: row.seller_id,
    sellerName: row.seller_name || 'Unknown',
    title: row.title,
    description: row.description,
    listingType: row.listing_type,
    price: row.price,
    status: row.status,
    categoryId: row.category_id,
    tags: row.tags || [],
    downloadCount: row.download_count || 0,
    rating: parseFloat(row.rating) || 0,
    reviewCount: row.review_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 리스팅 구매
 */
export async function purchaseListing(
  listingId: string,
  buyerId: string
): Promise<{ success: boolean; error?: string; purchaseId?: string }> {
  const listing = await getListingDetail(listingId)

  if (!listing) {
    return { success: false, error: 'Listing not found' }
  }

  if (listing.status !== 'active') {
    return { success: false, error: 'Listing is not available' }
  }

  if (listing.sellerId === buyerId) {
    return { success: false, error: 'Cannot purchase your own listing' }
  }

  // 무료 리스팅이 아닌 경우 포인트 확인
  if (listing.listingType !== 'free') {
    const userResult = await query(
      'SELECT points FROM profiles WHERE id = $1',
      [buyerId]
    )

    const userPoints = userResult.rows[0]?.points || 0
    if (userPoints < listing.price) {
      return { success: false, error: 'Insufficient points' }
    }

    // 포인트 차감
    await query(
      'UPDATE profiles SET points = points - $1 WHERE id = $2',
      [listing.price, buyerId]
    )

    // 판매자에게 포인트 지급 (수수료 10% 제외)
    const sellerPoints = Math.round(listing.price * 0.9)
    await query(
      'UPDATE profiles SET points = COALESCE(points, 0) + $1 WHERE id = $2',
      [sellerPoints, listing.sellerId]
    )

    // 거래 내역 기록
    await query(
      `INSERT INTO point_transactions (user_id, points, description, type)
       VALUES ($1, $2, $3, 'purchase')`,
      [buyerId, -listing.price, `마켓플레이스 구매: ${listing.title}`]
    )

    await query(
      `INSERT INTO point_transactions (user_id, points, description, type)
       VALUES ($1, $2, $3, 'sale')`,
      [listing.sellerId, sellerPoints, `마켓플레이스 판매: ${listing.title}`]
    )
  }

  // 구매 기록 저장
  const purchaseResult = await query(
    `INSERT INTO marketplace_purchases (listing_id, buyer_id, points_spent)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [listingId, buyerId, listing.price]
  )

  // 다운로드 카운트 증가
  await query(
    `UPDATE marketplace_listings
     SET download_count = COALESCE(download_count, 0) + 1
     WHERE id = $1`,
    [listingId]
  )

  return { success: true, purchaseId: purchaseResult.rows[0].id }
}

/**
 * 구매 여부 확인
 */
export async function hasPurchased(listingId: string, userId: string): Promise<boolean> {
  const result = await query(
    `SELECT id FROM marketplace_purchases
     WHERE listing_id = $1 AND buyer_id = $2`,
    [listingId, userId]
  )
  return result.rows.length > 0
}

/**
 * 카테고리별 리스팅 수 조회
 */
export async function getCategoryCounts(): Promise<MarketplaceCategory[]> {
  const result = await query(
    `SELECT category_id, COUNT(*) as count
     FROM marketplace_listings
     WHERE status = 'active'
     GROUP BY category_id`
  )

  const countMap: Record<string, number> = {}
  for (const row of result.rows) {
    countMap[row.category_id] = parseInt(row.count)
  }

  return MARKETPLACE_CATEGORIES.map(cat => ({
    ...cat,
    count: countMap[cat.id] || 0,
  }))
}

/**
 * 인기 리스팅 조회
 */
export async function getPopularListings(limit: number = 10): Promise<MarketplaceListing[]> {
  const { listings } = await searchListings({
    sortBy: 'popular',
    limit,
  })
  return listings
}

/**
 * 최신 리스팅 조회
 */
export async function getRecentListings(limit: number = 10): Promise<MarketplaceListing[]> {
  const { listings } = await searchListings({
    sortBy: 'newest',
    limit,
  })
  return listings
}
