// 디버그용 - convert-pdf 단계별 테스트
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'

export async function GET(request: NextRequest) {
  const steps: string[] = []

  try {
    // Step 1: Auth
    steps.push('1-auth-start')
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', steps }, { status: 401 })
    }
    steps.push('1-auth-ok: ' + user.uid)

    // Step 2: DB query
    steps.push('2-db-start')
    const { query } = await import('@/lib/db/client')
    const result = await query<{ gcs_path: string | null; file_url: string; filename: string | null }>(
      `SELECT gcs_path, file_url, filename FROM teaching_materials WHERE id = $1`,
      ['e4d8fa18-5614-45ee-ba30-360b8cc946f3']
    )
    steps.push('2-db-ok: rows=' + result.rows.length)

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Not found', steps }, { status: 404 })
    }

    const material = result.rows[0]
    steps.push('2-material: ' + material.filename)

    // Step 3: GCS fileExists
    steps.push('3-gcs-start')
    const { fileExists, extractPathFromUrl, downloadFile } = await import('@/lib/storage/gcs')
    const gcsPath = material.gcs_path || extractPathFromUrl(material.file_url)
    steps.push('3-gcsPath: ' + gcsPath)

    const pdfCachePath = (gcsPath || '').replace(/\.[^.]+$/, '_preview.pdf')
    const cached = await fileExists(pdfCachePath)
    steps.push('3-cached: ' + cached)

    if (cached) {
      return NextResponse.json({ cached: true, steps })
    }

    // Step 4: Firebase Admin credential
    steps.push('4-admin-start')
    const { getAdminApp } = await import('@/lib/firebase/admin')
    const app = getAdminApp()
    steps.push('4-app-ok')

    const credential = app.options.credential
    steps.push('4-credential: ' + (credential ? 'exists' : 'null'))

    if (!credential) {
      return NextResponse.json({ error: 'No credential', steps }, { status: 500 })
    }

    const tokenResult = await credential.getAccessToken()
    steps.push('4-token-ok: ' + (tokenResult.access_token ? tokenResult.access_token.substring(0, 20) + '...' : 'empty'))

    // Step 5: Download file (just check size, don't actually convert)
    steps.push('5-download-start')
    const fileBuffer = await downloadFile(gcsPath!)
    steps.push('5-download-ok: size=' + fileBuffer.length + ' bytes (' + Math.round(fileBuffer.length / 1024) + 'KB)')

    // Step 6: Test Drive API (just check if enabled)
    steps.push('6-drive-test-start')
    const testRes = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user',
      { headers: { Authorization: `Bearer ${tokenResult.access_token}` } }
    )
    const testBody = await testRes.text()
    steps.push('6-drive-test: status=' + testRes.status + ' body=' + testBody.substring(0, 200))

    return NextResponse.json({ steps })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    steps.push('ERROR: ' + errMsg)
    return NextResponse.json({ error: errMsg, steps }, { status: 500 })
  }
}
