export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 환영 메시지 스켈레톤 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="h-7 bg-gray-200 rounded w-60 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-40" />
      </div>

      {/* 랭크 정보 스켈레톤 */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
        <div className="h-3 bg-gray-200 rounded-full w-full mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-1" />
              <div className="h-3 bg-gray-100 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* 빠른 액션 스켈레톤 */}
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="h-12 w-12 rounded-lg bg-gray-200 mb-4" />
            <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}
