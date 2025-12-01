// src/app/api/materials/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 자료 정보 가져오기
    const { data: material, error: materialError } = await supabase
      .from('teaching_materials')
      .select('id, file_url, filename, user_id, download_count')
      .eq('id', id)
      .eq('status', 'approved')
      .single()

    if (materialError || !material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // 다운로드 카운트 증가
    const { error: updateError } = await supabase
      .from('teaching_materials')
      .update({ download_count: (material.download_count || 0) + 1 })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update download count:', updateError)
    }

    // 다운로드 기록 저장 (선택사항)
    // await supabase
    //   .from('downloads')
    //   .insert({
    //     user_id: user.id,
    //     material_id: id,
    //     downloaded_at: new Date().toISOString()
    //   })

    // 기여자에게 포인트 적립 (자동 랭크 업데이트 트리거)
    // download_count가 증가하면 트리거가 자동으로 랭크 재계산

    // 파일 URL 리다이렉트
    // Supabase Storage에서 서명된 URL 생성
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('teaching-materials')
      .createSignedUrl(material.file_url, 60) // 60초 유효

    if (signedUrlError || !signedUrlData) {
      console.error('Failed to create signed URL:', signedUrlError)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    // 파일 다운로드를 위한 리다이렉트
    return NextResponse.redirect(signedUrlData.signedUrl)

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET 메서드로도 다운로드 가능하도록 (직접 링크 지원)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params })
}
