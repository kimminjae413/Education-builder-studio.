// src/app/api/materials/confirm-upload/route.ts
// GCS 직접 업로드 완료 후 DB 메타데이터 저장

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { createMaterial } from '@/lib/db/queries'
import { fileExists, getPublicUrl, deleteFile } from '@/lib/storage/gcs'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      gcsPath,
      filename,
      fileSize,
      fileType,
      title,
      description,
      targetCategory,
      subjectCategory,
    } = await request.json()

    if (!gcsPath || !filename || !title?.trim()) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다' }, { status: 400 })
    }

    // GCS 경로가 해당 유저의 디렉토리인지 검증
    if (!gcsPath.startsWith(`materials/${user.uid}/`)) {
      return NextResponse.json({ error: '잘못된 파일 경로입니다' }, { status: 403 })
    }

    // 파일이 실제로 GCS에 존재하는지 확인
    const exists = await fileExists(gcsPath)
    if (!exists) {
      return NextResponse.json(
        { error: '파일이 업로드되지 않았습니다. 다시 시도해주세요.' },
        { status: 400 }
      )
    }

    const fileUrl = getPublicUrl(gcsPath)

    const material = await createMaterial({
      user_id: user.uid,
      filename,
      file_url: fileUrl,
      gcs_path: gcsPath,
      file_size: fileSize,
      file_type: fileType,
      title: title.trim(),
      description: description?.trim() || null,
      target_category: targetCategory || null,
      subject_category: subjectCategory || null,
      status: 'pending',
      is_seed_data: false,
      indexed: false,
    })

    return NextResponse.json({
      success: true,
      material,
      message: '파일이 성공적으로 업로드되었습니다',
    })
  } catch (error) {
    console.error('업로드 확인 오류:', error)
    return NextResponse.json(
      { error: '업로드 확인에 실패했습니다' },
      { status: 500 }
    )
  }
}
