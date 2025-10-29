export default function DesignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI 설계 마법사</h1>
        <p className="text-gray-600">AI의 도움을 받아 교육과정을 설계하세요</p>
      </div>

      <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          AI 설계 마법사 (곧 출시)
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Week 5-6에서 Gemini API를 연동하여<br />
          맞춤형 교육과정 추천 기능을 개발할 예정입니다
        </p>
      </div>
    </div>
  )
}
