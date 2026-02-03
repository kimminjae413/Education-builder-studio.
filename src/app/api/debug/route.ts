import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {}

  const key = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  results.hasKey = !!key

  if (key) {
    try {
      const parsed = JSON.parse(key)
      results.projectId = parsed.project_id

      // private_key 상태 확인
      const pk = parsed.private_key || ''
      results.pkLength = pk.length
      results.pkStart = pk.substring(0, 40)
      results.pkHasLiteralBackslashN = pk.includes('\\n')
      results.pkHasNewline = pk.includes('\n')

      // 수정된 private_key로 테스트
      const fixedPk = pk.replace(/\\n/g, '\n')
      results.fixedPkHasNewline = fixedPk.includes('\n')
      results.fixedPkStart = fixedPk.substring(0, 40)

    } catch (e: any) {
      results.parseError = e.message
    }
  }

  return NextResponse.json(results)
}
