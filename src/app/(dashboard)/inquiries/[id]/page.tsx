// src/app/(dashboard)/inquiries/[id]/page.tsx
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getInquiryById, getInquiryReplies } from '@/lib/db/inquiries'
import { InquiryThread } from '@/components/inquiries/InquiryThread'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }

  let user
  try {
    user = await verifyIdToken(token)
  } catch {
    redirect('/login')
  }

  const { id } = await params
  const inquiry = await getInquiryById(id, user.uid)

  if (!inquiry) {
    notFound()
  }

  const replies = await getInquiryReplies(id)

  const serializedInquiry = {
    ...inquiry,
    created_at: typeof inquiry.created_at === 'string' ? inquiry.created_at : new Date(inquiry.created_at).toISOString(),
    updated_at: typeof inquiry.updated_at === 'string' ? inquiry.updated_at : new Date(inquiry.updated_at).toISOString(),
  }

  const serializedReplies = replies.map(r => ({
    ...r,
    created_at: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  }))

  return (
    <div className="space-y-6">
      <Link
        href="/inquiries"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-cobalt-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        내 문의 목록
      </Link>

      <InquiryThread inquiry={serializedInquiry} initialReplies={serializedReplies} />
    </div>
  )
}
