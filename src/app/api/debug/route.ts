import { NextResponse } from 'next/server'

export async function GET() {
  const hasServiceAccountKey = !!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  const keyLength = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY?.length || 0
  const keyStart = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY?.substring(0, 20) || 'empty'

  let parseResult = 'not attempted'
  if (hasServiceAccountKey) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY!)
      parseResult = `success - project_id: ${parsed.project_id || 'missing'}`
    } catch (e: any) {
      parseResult = `failed: ${e.message}`
    }
  }

  return NextResponse.json({
    hasServiceAccountKey,
    keyLength,
    keyStart,
    parseResult,
    nodeEnv: process.env.NODE_ENV,
  })
}
