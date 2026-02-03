// src/app/api/profile/upload-image/route.ts
// 프로필 이미지 업로드 API

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server-auth'
import { updateProfile } from '@/lib/db/queries'
import { uploadFile, deleteFile, extractPathFromUrl } from '@/lib/storage/gcs'

// 허용되는 이미지 타입
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    console.log('[upload-image] Starting upload...')

    const user = await getAuthenticatedUser(request)
    if (!user) {
      console.log('[upload-image] Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[upload-image] User:', user.uid)

    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 })
    }
    console.log('[upload-image] File:', file.name, file.type, file.size)

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG, PNG, GIF, WebP 형식의 이미지만 업로드 가능합니다' },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다' },
        { status: 400 }
      )
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('[upload-image] Buffer created:', buffer.length)

    // 파일 확장자 추출
    const ext = file.type.split('/')[1] || 'jpg'

    // GCS 경로 생성 (profiles/{userId}/avatar.{ext})
    const gcsPath = `profiles/${user.uid}/avatar.${ext}`
    console.log('[upload-image] GCS path:', gcsPath)

    // 기존 이미지가 있으면 삭제 (다른 확장자일 수 있음)
    const existingExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    for (const oldExt of existingExts) {
      if (oldExt !== ext) {
        await deleteFile(`profiles/${user.uid}/avatar.${oldExt}`).catch(() => {})
      }
    }

    // GCS에 업로드
    console.log('[upload-image] Uploading to GCS...')
    let publicUrl: string
    try {
      publicUrl = await uploadFile(buffer, gcsPath, file.type, {
        uploadedBy: user.uid,
        originalName: file.name,
      })
      console.log('[upload-image] GCS upload success:', publicUrl)
    } catch (gcsError) {
      console.error('[upload-image] GCS upload failed:', gcsError)
      return NextResponse.json(
        { error: 'GCS 업로드 실패: ' + (gcsError instanceof Error ? gcsError.message : 'Unknown') },
        { status: 500 }
      )
    }

    // 프로필 업데이트
    console.log('[upload-image] Updating profile...')
    try {
      const updatedProfile = await updateProfile(user.uid, {
        profile_image_url: publicUrl,
      })

      if (!updatedProfile) {
        console.error('[upload-image] Profile update returned null')
        return NextResponse.json({ error: '프로필 업데이트 실패' }, { status: 500 })
      }
      console.log('[upload-image] Profile updated successfully')
    } catch (dbError) {
      console.error('[upload-image] DB update failed:', dbError)
      return NextResponse.json(
        { error: 'DB 업데이트 실패: ' + (dbError instanceof Error ? dbError.message : 'Unknown') },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
    })
  } catch (error) {
    console.error('Profile image upload error:', error)
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    )
  }
}

// DELETE: 프로필 이미지 삭제
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 모든 가능한 확장자의 이미지 삭제 시도
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    for (const ext of extensions) {
      await deleteFile(`profiles/${user.uid}/avatar.${ext}`).catch(() => {})
    }

    // 프로필에서 이미지 URL 제거
    await updateProfile(user.uid, {
      profile_image_url: null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile image delete error:', error)
    return NextResponse.json(
      { error: '이미지 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
