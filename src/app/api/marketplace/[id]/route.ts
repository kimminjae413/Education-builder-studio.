// src/app/api/marketplace/[id]/route.ts
// 마켓플레이스 리스팅 상세 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import {
  getListingDetail,
  purchaseListing,
  hasPurchased,
  updateListingStatus,
} from '@/lib/marketplace/marketplace'

// GET: 리스팅 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const listing = await getListingDetail(id)

    if (!listing) {
      return NextResponse.json({
        error: 'Listing not found',
      }, { status: 404 })
    }

    // 로그인한 사용자라면 구매 여부 확인
    let purchased = false
    const user = await getAuthenticatedUser(request)
    if (user) {
      purchased = await hasPurchased(id, user.uid)
    }

    return NextResponse.json({
      success: true,
      listing,
      purchased,
    })
  } catch (error: any) {
    console.error('❌ 리스팅 조회 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}

// POST: 리스팅 구매
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 이미 구매했는지 확인
    const alreadyPurchased = await hasPurchased(id, user.uid)
    if (alreadyPurchased) {
      return NextResponse.json({
        error: 'Already purchased',
      }, { status: 400 })
    }

    console.log('💰 리스팅 구매 시도:', { listingId: id, userId: user.uid })

    const result = await purchaseListing(id, user.uid)

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      purchaseId: result.purchaseId,
      message: 'Purchase successful',
    })
  } catch (error: any) {
    console.error('❌ 구매 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}

// PATCH: 리스팅 상태 변경 (판매자/관리자)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({
        error: 'status is required',
      }, { status: 400 })
    }

    const listing = await getListingDetail(id)
    if (!listing) {
      return NextResponse.json({
        error: 'Listing not found',
      }, { status: 404 })
    }

    // 판매자 본인이거나 관리자만 수정 가능
    // (관리자 체크는 실제 구현 시 추가)
    if (listing.sellerId !== user.uid) {
      return NextResponse.json({
        error: 'Not authorized to modify this listing',
      }, { status: 403 })
    }

    await updateListingStatus(id, status)

    return NextResponse.json({
      success: true,
      message: `Listing status updated to ${status}`,
    })
  } catch (error: any) {
    console.error('❌ 리스팅 수정 오류:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    }, { status: 500 })
  }
}
