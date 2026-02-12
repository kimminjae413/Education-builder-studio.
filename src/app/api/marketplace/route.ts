// src/app/api/marketplace/route.ts
// 마켓플레이스 메인 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import {
  searchListings,
  createListing,
  getCategoryCounts,
  getPopularListings,
  getRecentListings,
  MARKETPLACE_CATEGORIES,
} from '@/lib/marketplace/marketplace'

// GET: 마켓플레이스 검색 및 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'search'

    switch (action) {
      case 'search': {
        const query = searchParams.get('q') || undefined
        const categoryId = searchParams.get('category') || undefined
        const listingType = searchParams.get('type') as any || undefined
        const minRating = searchParams.get('minRating')
          ? parseFloat(searchParams.get('minRating')!)
          : undefined
        const sortBy = searchParams.get('sort') as any || 'newest'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const result = await searchListings({
          query,
          categoryId,
          listingType,
          minRating,
          sortBy,
          page,
          limit,
        })

        return NextResponse.json({
          success: true,
          ...result,
          page,
          totalPages: Math.ceil(result.total / limit),
        })
      }

      case 'categories': {
        const categories = await getCategoryCounts()
        return NextResponse.json({
          success: true,
          categories,
        })
      }

      case 'popular': {
        const limit = parseInt(searchParams.get('limit') || '10')
        const listings = await getPopularListings(limit)
        return NextResponse.json({
          success: true,
          listings,
        })
      }

      case 'recent': {
        const limit = parseInt(searchParams.get('limit') || '10')
        const listings = await getRecentListings(limit)
        return NextResponse.json({
          success: true,
          listings,
        })
      }

      case 'home': {
        // 마켓플레이스 홈 데이터
        const [categories, popular, recent] = await Promise.all([
          getCategoryCounts(),
          getPopularListings(6),
          getRecentListings(6),
        ])

        return NextResponse.json({
          success: true,
          categories,
          popularListings: popular,
          recentListings: recent,
        })
      }

      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['search', 'categories', 'popular', 'recent', 'home'],
        }, { status: 400 })
    }
  } catch (error: any) {
    console.error('❌ 마켓플레이스 조회 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}

// POST: 리스팅 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      materialId,
      title,
      description,
      listingType = 'free',
      price = 0,
      categoryId,
      tags = [],
    } = body

    if (!materialId || !title || !categoryId) {
      return NextResponse.json({
        error: 'materialId, title, and categoryId are required',
      }, { status: 400 })
    }

    if (listingType !== 'free' && price <= 0) {
      return NextResponse.json({
        error: 'Price must be greater than 0 for paid listings',
      }, { status: 400 })
    }

    console.log('📦 마켓플레이스 리스팅 생성:', {
      materialId,
      title,
      listingType,
      price,
    })

    const result = await createListing({
      materialId,
      sellerId: user.uid,
      title,
      description: description || '',
      listingType,
      price: listingType === 'free' ? 0 : price,
      categoryId,
      tags,
    })

    return NextResponse.json({
      success: true,
      listingId: result.id,
      message: 'Listing created successfully. Pending review.',
    })
  } catch (error: any) {
    console.error('❌ 리스팅 생성 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}
