import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cobalt-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-cobalt-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">EBS</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Education Builder Studio</h1>
              <p className="text-xs text-gray-600">지혜를 설계하고, 경험을 공유하며</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm text-gray-600 hover:text-cobalt-600">
              플랫폼 소개
            </Link>
            <Link href="/features" className="text-sm text-gray-600 hover:text-cobalt-600">
              주요 기능
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-cobalt-600">
              요금제
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-gray-700 hover:text-cobalt-600"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-cobalt-500 text-white rounded-lg hover:bg-cobalt-600 transition-colors"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cobalt-100 text-cobalt-700 rounded-full text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cobalt-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cobalt-500"></span>
            </span>
            베타 서비스 오픈
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            AI와 함께하는<br />
            <span className="text-cobalt-500">교육과정 설계</span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed">
            프리랜서 강사들을 위한 AI 기반 교육과정 개발 플랫폼.<br />
            베테랑의 지혜를 공유하고, 함께 성장하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-cobalt-500 text-white text-lg font-medium rounded-lg hover:bg-cobalt-600 transition-all hover:shadow-cobalt-lg"
            >
              무료로 시작하기 →
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 bg-white border-2 border-cobalt-200 text-cobalt-600 text-lg font-medium rounded-lg hover:border-cobalt-500 transition-colors"
            >
              데모 보기
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            💳 신용카드 등록 불필요 · 베타 기간 무료
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-cobalt-300 hover:shadow-cobalt-md transition-all">
            <div className="h-12 w-12 bg-cobalt-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              AI 설계 마법사
            </h3>
            <p className="text-gray-600 leading-relaxed">
              학습 대상, 교구, 주제를 입력하면 AI가 최적의 교육과정을 추천해드립니다.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-cobalt-300 hover:shadow-cobalt-md transition-all">
            <div className="h-12 w-12 bg-gold-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              랭크 & 리워드
            </h3>
            <p className="text-gray-600 leading-relaxed">
              콘텐츠 기여도에 따라 자동으로 랭크가 상승하고, 리워드를 받으세요.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-cobalt-300 hover:shadow-cobalt-md transition-all">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              베테랑 라이브러리
            </h3>
            <p className="text-gray-600 leading-relaxed">
              경력 10년 이상 강사들의 검증된 교육 자료를 활용할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-cobalt-500 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-cobalt-100">검증된 교육 자료</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-cobalt-100">베테랑 강사</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">30분</div>
              <div className="text-cobalt-100">평균 설계 시간</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-cobalt-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">EBS</span>
              </div>
              <span className="text-gray-600">© 2025 에듀이노랩. All rights reserved.</span>
            </div>
            
            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="/terms" className="hover:text-cobalt-600">이용약관</Link>
              <Link href="/privacy" className="hover:text-cobalt-600">개인정보처리방침</Link>
              <Link href="/contact" className="hover:text-cobalt-600">문의하기</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
