import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cobalt-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cobalt-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">EBS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Education Builder Studio</h1>
              <p className="text-xs text-gray-600">지혜를 설계하고, 경험을 공유하다</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-700 hover:text-cobalt-600 font-medium transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-cobalt-500 text-white font-medium rounded-lg hover:bg-cobalt-600 transition-all shadow-lg shadow-cobalt-200 hover:shadow-xl"
            >
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-cobalt-200 rounded-full shadow-sm">
              <span className="h-2 w-2 bg-cobalt-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-cobalt-700">베타 서비스 오픈</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center space-y-6 mb-12">
            <h2 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight">
              AI와 함께하는<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cobalt-500 to-blue-600">
                교육과정 설계
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              프리랜서 강사들을 위한 <strong>AI 기반 교육과정 개발 플랫폼</strong>.<br />
              베테랑의 지혜를 공유하고, 함께 성장하세요.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group px-8 py-4 bg-gradient-to-r from-cobalt-500 to-blue-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              무료로 시작하기
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 text-lg font-bold rounded-xl hover:border-cobalt-500 hover:text-cobalt-600 transition-all duration-300"
            >
              데모 보기
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>신용카드 등록 불필요</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>베타 기간 무료</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl font-black text-cobalt-600 mb-2">100+</div>
              <div className="text-gray-600 font-medium">베테랑 강사 자료</div>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl font-black text-cobalt-600 mb-2">10년+</div>
              <div className="text-gray-600 font-medium">평균 경력</div>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl font-black text-cobalt-600 mb-2">3초</div>
              <div className="text-gray-600 font-medium">AI 설계 생성</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">주요 기능</h3>
            <p className="text-xl text-gray-600">강사님들의 교육 설계를 위한 완벽한 도구</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-cobalt-500 hover:shadow-2xl transition-all duration-300">
              <div className="h-16 w-16 bg-gradient-to-br from-cobalt-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🤖</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">AI 설계 마법사</h4>
              <p className="text-gray-600 leading-relaxed">
                학습 대상, 교구, 주제를 입력하면 AI가 <strong>최적의 교육과정을 3초 안에</strong> 추천해드립니다.
              </p>
              <div className="mt-6 flex items-center text-cobalt-600 font-medium group-hover:translate-x-2 transition-transform">
                자세히 보기
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-gold-400 hover:shadow-2xl transition-all duration-300">
              <div className="h-16 w-16 bg-gradient-to-br from-gold-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🏆</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">랭크 & 리워드</h4>
              <p className="text-gray-600 leading-relaxed">
                콘텐츠 기여도에 따라 <strong>자동으로 랭크가 상승</strong>하고, 리워드를 받으세요.
              </p>
              <div className="mt-6 flex items-center text-gold-600 font-medium group-hover:translate-x-2 transition-transform">
                자세히 보기
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-green-500 hover:shadow-2xl transition-all duration-300">
              <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">📚</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">베테랑 라이브러리</h4>
              <p className="text-gray-600 leading-relaxed">
                <strong>경력 10년 이상 강사들의 검증된</strong> 교육 자료를 활용할 수 있습니다.
              </p>
              <div className="mt-6 flex items-center text-green-600 font-medium group-hover:translate-x-2 transition-transform">
                자세히 보기
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-cobalt-500 to-blue-600 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
              3단계로 시작하는 교육과정 설계
            </h3>
            <p className="text-xl text-cobalt-100 mb-16">
              복잡한 과정 없이, 누구나 쉽게 전문가 수준의 교육과정을 설계할 수 있습니다
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-4 text-2xl font-black text-cobalt-600">
                  1
                </div>
                <h4 className="text-2xl font-bold text-white mb-3">입력하기</h4>
                <p className="text-cobalt-100">
                  교육 목표, 대상, 주제를 간단히 입력하세요
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-4 text-2xl font-black text-cobalt-600">
                  2
                </div>
                <h4 className="text-2xl font-bold text-white mb-3">AI 설계</h4>
                <p className="text-cobalt-100">
                  AI가 3가지 최적의 설계안을 자동 생성합니다
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-4 text-2xl font-black text-cobalt-600">
                  3
                </div>
                <h4 className="text-2xl font-bold text-white mb-3">활용하기</h4>
                <p className="text-cobalt-100">
                  마음에 드는 설계안을 선택하고 바로 사용하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              이미 많은 강사들이 경험했습니다
            </h3>
            <p className="text-xl text-gray-600">베타 테스터들의 생생한 후기</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-cobalt-100 rounded-full flex items-center justify-center text-xl font-bold text-cobalt-600">
                  김
                </div>
                <div>
                  <div className="font-bold text-gray-900">김○○</div>
                  <div className="text-sm text-gray-600">코딩 강사 · 경력 8년</div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "AI가 만들어준 교육과정이 제가 10년 경력으로 짜던 것보다 체계적이어서 놀랐습니다. 
                <strong>시간이 80% 절약</strong>되었어요!"
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-xl font-bold text-green-600">
                  박
                </div>
                <div>
                  <div className="font-bold text-gray-900">박○○</div>
                  <div className="text-sm text-gray-600">메이커 교육 강사 · 경력 5년</div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "다른 베테랑 선생님들의 자료를 참고할 수 있어서 너무 좋아요. 
                <strong>혼자 고민하던 시간이 확 줄었습니다</strong>!"
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-cobalt-500 to-blue-600 rounded-3xl p-12 text-center shadow-2xl">
          <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
            지금 바로 시작하세요
          </h3>
          <p className="text-xl text-cobalt-100 mb-8">
            베타 기간 동안 무료로 모든 기능을 사용할 수 있습니다
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-cobalt-600 text-xl font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            무료로 시작하기
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-4 text-sm text-cobalt-100">
            신용카드 등록 불필요 · 언제든 취소 가능
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center text-gray-600">
            <p className="mb-4">
              © 2025 Education Builder Studio. All rights reserved.
            </p>
            <p className="text-sm">
              에듀이노랩 · K-Startup 2025 혁신창업리그
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
