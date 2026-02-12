// 디버그용 - Google Drive API 활성화
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { GoogleAuth } from 'google-auth-library'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keyJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
      || process.env.GCS_SERVICE_ACCOUNT_KEY
      || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

    if (!keyJson) {
      return NextResponse.json({ error: 'No service account key' }, { status: 500 })
    }

    const parsed = JSON.parse(keyJson)
    if (parsed.private_key) {
      let pk = parsed.private_key
      pk = pk.replace(/\\\\n/g, '\n')
      pk = pk.replace(/\\n/g, '\n')
      pk = pk.split('\\n').join('\n')
      pk = pk.replace(/-----BEGIN\s*PRIVATE\s*KEY-----/gi, '-----BEGIN PRIVATE KEY-----')
      pk = pk.replace(/-----END\s*PRIVATE\s*KEY-----/gi, '-----END PRIVATE KEY-----')
      pk = pk.replace(/-----BEGIN PRIVATE KEY-----\s*/g, '-----BEGIN PRIVATE KEY-----\n')
      pk = pk.replace(/\s*-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
      parsed.private_key = pk
    }

    // cloud-platform 스코프로 토큰 발급
    const auth = new GoogleAuth({
      credentials: parsed,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    const client = await auth.getClient()
    const tokenRes = await client.getAccessToken()
    const token = tokenRes.token

    // Service Usage API로 Drive API 활성화
    const projectNumber = '563216369421'
    const enableRes = await fetch(
      `https://serviceusage.googleapis.com/v1/projects/${projectNumber}/services/drive.googleapis.com:enable`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const body = await enableRes.json()
    return NextResponse.json({
      status: enableRes.status,
      body,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
