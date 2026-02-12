// src/app/api/debug-gcs/route.ts
// GCS 설정 디버그용 API (임시)

import { NextResponse } from 'next/server'

export async function GET() {
  // Production guard - 프로덕션에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const firebaseKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    const gcsKey = process.env.GCS_SERVICE_ACCOUNT_KEY

    let firebaseEmail = null
    let gcsEmail = null

    if (firebaseKey) {
      try {
        const parsed = JSON.parse(firebaseKey)
        firebaseEmail = parsed.client_email
      } catch {
        firebaseEmail = 'parse error'
      }
    }

    if (gcsKey) {
      try {
        const parsed = JSON.parse(gcsKey)
        gcsEmail = parsed.client_email
      } catch {
        gcsEmail = 'parse error'
      }
    }

    return NextResponse.json({
      GCS_PROJECT_ID: process.env.GCS_PROJECT_ID || 'not set',
      GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME || 'not set',
      FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY: firebaseKey ? `exists (${firebaseEmail})` : 'not set',
      GCS_SERVICE_ACCOUNT_KEY: gcsKey ? `exists (${gcsEmail})` : 'not set',
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
