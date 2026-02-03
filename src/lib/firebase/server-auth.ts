// src/lib/firebase/server-auth.ts
// 서버 사이드 인증 헬퍼 함수 (API Routes용)

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from './admin'
import { getProfile } from '../db/queries'
import { DecodedIdToken } from 'firebase-admin/auth'

export interface AuthenticatedUser {
  uid: string
  email: string | undefined
  emailVerified: boolean
}

// Authorization 헤더 또는 쿠키에서 토큰 추출
function extractToken(request: NextRequest): string | null {
  // 1. Authorization 헤더 확인 (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 2. X-Firebase-Token 헤더 확인 (미들웨어에서 설정)
  const firebaseToken = request.headers.get('x-firebase-token')
  if (firebaseToken) {
    return firebaseToken
  }

  // 3. 쿠키 확인
  const cookieToken = request.cookies.get('firebase-token')?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

// 인증된 사용자 정보 가져오기
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const token = extractToken(request)

  if (!token) {
    return null
  }

  try {
    const decodedToken = await verifyIdToken(token)
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// 인증 필수 API 래퍼
export function withAuth<T>(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser,
    ...args: unknown[]
  ) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(request, user, ...args)
  }
}

// 관리자 권한 확인 (DB 조회 포함)
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await getProfile(userId)
    return profile?.role === 'admin'
  } catch {
    return false
  }
}

// 관리자 전용 API 래퍼
export function withAdmin<T>(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser,
    ...args: unknown[]
  ) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminCheck = await isAdmin(user.uid)
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    return handler(request, user, ...args)
  }
}

// 인증 응답 생성 헬퍼
export function authErrorResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}
