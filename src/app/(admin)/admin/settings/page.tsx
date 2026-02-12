// src/app/(admin)/admin/settings/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile } from '@/lib/db/queries'
import { query } from '@/lib/db/client'

async function getSystemStats() {
  try {
    const [usersResult, materialsResult, coursesResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM profiles'),
      query('SELECT COUNT(*) as count FROM teaching_materials'),
      query('SELECT COUNT(*) as count FROM courses'),
    ])

    return {
      totalUsers: parseInt(usersResult.rows[0]?.count || '0'),
      totalMaterials: parseInt(materialsResult.rows[0]?.count || '0'),
      totalCourses: parseInt(coursesResult.rows[0]?.count || '0'),
    }
  } catch (error) {
    console.error('Stats error:', error)
    return { totalUsers: 0, totalMaterials: 0, totalCourses: 0 }
  }
}

export default async function AdminSettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) { redirect('/login') }
  const user = await verifyIdToken(token)

  // 관리자 권한 확인
  const profile = await getProfile(user.uid)
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const stats = await getSystemStats()

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-1">
          시스템 설정 및 정보를 관리합니다
        </p>
      </div>

      {/* 시스템 정보 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">시스템 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">총 사용자</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}명</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">총 자료</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalMaterials.toLocaleString()}개</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">총 교육과정</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCourses.toLocaleString()}개</div>
          </div>
        </div>
      </div>

      {/* 환경 설정 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">환경 설정</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium text-gray-900">배포 환경</div>
              <div className="text-sm text-gray-500">현재 실행 중인 환경</div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium text-gray-900">AI 모델</div>
              <div className="text-sm text-gray-500">교육과정 생성에 사용되는 AI</div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Gemini 2.0 Flash
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium text-gray-900">RAG 시스템</div>
              <div className="text-sm text-gray-500">검색 증강 생성 엔진</div>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              Gemini File Search API
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium text-gray-900">파일 저장소</div>
              <div className="text-sm text-gray-500">업로드 파일 저장 위치</div>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              Google Cloud Storage
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900">데이터베이스</div>
              <div className="text-sm text-gray-500">데이터 저장소</div>
            </div>
            <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
              Cloud SQL PostgreSQL
            </span>
          </div>
        </div>
      </div>

      {/* 리워드 설정 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">리워드 포인트 설정</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cobalt-600">+10</div>
              <div className="text-sm text-gray-500">인용 (Citation)</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cobalt-600">+5</div>
              <div className="text-sm text-gray-500">참조 (Reference)</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cobalt-600">+3</div>
              <div className="text-sm text-gray-500">다운로드</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cobalt-600">+1</div>
              <div className="text-sm text-gray-500">조회</div>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            * 현재 포인트 설정은 코드에서 관리됩니다. 추후 동적 설정 기능이 추가될 예정입니다.
          </p>
        </div>
      </div>

      {/* 랭크 시스템 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">랭크 시스템</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">랭크</th>
                <th className="pb-3 font-medium">필요 포인트</th>
                <th className="pb-3 font-medium">AI 생성 횟수/월</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3">🌱 새싹 (Newcomer)</td>
                <td className="py-3">0</td>
                <td className="py-3">10회</td>
              </tr>
              <tr>
                <td className="py-3">📘 초급 (Junior)</td>
                <td className="py-3">100</td>
                <td className="py-3">30회</td>
              </tr>
              <tr>
                <td className="py-3">📗 중급 (Intermediate)</td>
                <td className="py-3">500</td>
                <td className="py-3">100회</td>
              </tr>
              <tr>
                <td className="py-3">📕 고급 (Senior)</td>
                <td className="py-3">2,000</td>
                <td className="py-3">무제한</td>
              </tr>
              <tr>
                <td className="py-3">🏆 베테랑 (Veteran)</td>
                <td className="py-3">5,000</td>
                <td className="py-3">무제한</td>
              </tr>
              <tr>
                <td className="py-3">💎 마스터 (Master)</td>
                <td className="py-3">10,000</td>
                <td className="py-3">무제한</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 버전 정보 */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Education Builder Studio</div>
            <div className="text-sm text-gray-500">버전 0.3.0</div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>© 2026 EduinoLab</div>
            <div>Powered by Next.js 15 & Gemini AI</div>
          </div>
        </div>
      </div>
    </div>
  )
}
