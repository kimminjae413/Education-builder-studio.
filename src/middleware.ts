// src/middleware.ts
// Firebase Auth 기반 미들웨어

import { NextResponse, type NextRequest } from 'next/server'

// Edge Runtime에서는 Firebase Admin SDK를 직접 사용할 수 없으므로
// 클라이언트에서 전송한 ID Token을 API Route에서 검증하는 방식으로 변경

// 보호된 경로 목록
const PROTECTED_PATHS = ['/dashboard', '/design', '/library', '/contribute', '/rewards', '/profile', '/admin']

// 인증 쿠키 이름
const AUTH_COOKIE_NAME = 'firebase-token'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 정적 파일 및 API 경로는 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // 파일 확장자가 있는 경우
  ) {
    return NextResponse.next()
  }

  // 인증 토큰 확인 (쿠키 또는 Authorization 헤더)
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const hasToken = !!token

  // 보호된 페이지 접근 확인
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  // 로그인/회원가입 페이지
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  // 보호된 페이지에 토큰 없이 접근 시 로그인 페이지로 리다이렉트
  if (isProtectedPath && !hasToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 로그인/회원가입 페이지는 클라이언트에서 인증 상태 확인 후 리디렉션 처리
  // 미들웨어에서 리디렉션하면 무효 토큰일 때 루프 발생 가능
  // if (isAuthPage && hasToken) {
  //   return NextResponse.redirect(new URL('/dashboard', request.url))
  // }

  // 토큰이 있으면 요청 헤더에 추가 (API 라우트에서 사용)
  if (hasToken) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-firebase-token', token)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 경로에 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - 이미지 파일들 (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
