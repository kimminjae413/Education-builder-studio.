// src/lib/firebase/auth.ts
// Firebase 인증 헬퍼 함수

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { getFirebaseAuth } from './client'

// 인증 결과 타입
type AuthResult = {
  user: User | null
  error: string | null
}

// 이메일/비밀번호 로그인
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const auth = getFirebaseAuth()
    const result = await signInWithEmailAndPassword(auth, email, password)
    return { user: result.user, error: null }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    return { user: null, error: error.code || error.message || 'Unknown error' }
  }
}

// 이메일/비밀번호 회원가입
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const auth = getFirebaseAuth()
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return { user: result.user, error: null }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    return { user: null, error: error.code || error.message || 'Unknown error' }
  }
}

// 로그아웃
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  return firebaseSignOut(auth)
}

// 현재 사용자 가져오기
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

// 인증 상태 변경 리스너
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, callback)
}

// ID 토큰 가져오기 (API 호출용)
export async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

// 토큰 강제 갱신
export async function refreshToken(): Promise<string | null> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken(true)
}
