// src/lib/firebase/admin.ts
// Firebase Admin SDK (서버 환경용)

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { cache } from 'react'

let adminApp: App
let adminAuth: Auth

function getServiceAccountKey() {
  const key = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  if (!key) {
    // 서비스 계정 키가 없으면 ADC 사용
    return null
  }

  // JSON 문자열이면 파싱
  try {
    const parsed = JSON.parse(key)

    // private_key 수정 - 다양한 줄바꿈 형식 처리
    if (parsed.private_key) {
      // 문자열 리터럴 \\n을 실제 줄바꿈으로 변환 (여러 번 시도)
      let pk = parsed.private_key

      // 1. 이스케이프된 \\n (JSON에서 이중 이스케이프) -> \n
      pk = pk.replace(/\\\\n/g, '\n')
      // 2. 단일 \\n -> \n
      pk = pk.replace(/\\n/g, '\n')
      // 3. 리터럴 백슬래시+n 문자열
      pk = pk.split('\\n').join('\n')

      // PEM 헤더/푸터 정리 - 다양한 손상된 형식 처리
      // "PRIVATEKEY" -> "PRIVATE KEY" (공백 없는 경우)
      pk = pk.replace(/-----BEGIN\s*PRIVATE\s*KEY-----/gi, '-----BEGIN PRIVATE KEY-----')
      pk = pk.replace(/-----END\s*PRIVATE\s*KEY-----/gi, '-----END PRIVATE KEY-----')

      // 헤더/푸터 주변 공백 정리
      pk = pk.replace(/-----BEGIN PRIVATE KEY-----\s*/g, '-----BEGIN PRIVATE KEY-----\n')
      pk = pk.replace(/\s*-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')

      parsed.private_key = pk

      // 디버깅: private_key 시작/끝 확인 (프로덕션에서는 로그 안 남김)
      if (process.env.NODE_ENV === 'development') {
        console.log('Private key starts with:', pk.substring(0, 50))
        console.log('Private key ends with:', pk.substring(pk.length - 50))
      }
    }

    return parsed
  } catch (e) {
    console.error('Failed to parse service account key:', e)
    return null
  }
}

export function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      const credentials = getServiceAccountKey()
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

      // 서비스 계정 키가 있으면 사용, 없으면 ADC 사용
      adminApp = credentials
        ? initializeApp({
            credential: cert(credentials),
            projectId,
          })
        : initializeApp({ projectId })
    } else {
      adminApp = getApps()[0]
    }
  }
  return adminApp
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp())
  }
  return adminAuth
}

// 사용자 삭제 (관리자 전용)
export async function deleteUser(uid: string): Promise<void> {
  const auth = getAdminAuth()
  await auth.deleteUser(uid)
}

// 사용자 목록 조회 (관리자 전용)
export async function listUsers(maxResults: number = 100) {
  const auth = getAdminAuth()
  return auth.listUsers(maxResults)
}

// ID 토큰 검증 (React cache로 같은 요청 내 중복 호출 제거)
export const verifyIdToken = cache(async (idToken: string) => {
  const auth = getAdminAuth()
  return auth.verifyIdToken(idToken)
})
