// src/lib/firebase/admin.ts
// Firebase Admin SDK (서버 환경용)

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let adminApp: App
let adminAuth: Auth

function getServiceAccountKey() {
  const key = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  if (!key) {
    // 서비스 계정 키가 없으면 ADC 사용
    return null
  }

  // JSON 문자열이면 파싱, 아니면 그대로 반환
  try {
    return JSON.parse(key)
  } catch {
    return key
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

// ID 토큰 검증
export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth()
  return auth.verifyIdToken(idToken)
}
