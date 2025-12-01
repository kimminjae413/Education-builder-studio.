'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Sparkles,
  Clock,
  AlertTriangle,
  FileX,
  Zap,
  Brain,
  Users,
  Trophy,
  ArrowRight,
  ChevronDown,
  Star,
  Check,
  BookOpen,
  Target,
  Lightbulb
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const problemRef = useRef<HTMLDivElement>(null)
  const solutionRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero 애니메이션
      const heroTl = gsap.timeline()
      heroTl
        .from('.hero-badge', {
          opacity: 0,
          y: -20,
          duration: 0.6,
          ease: 'power3.out'
        })
        .from('.hero-title-line', {
          opacity: 0,
          y: 50,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out'
        }, '-=0.3')
        .from('.hero-subtitle', {
          opacity: 0,
          y: 30,
          duration: 0.6,
          ease: 'power3.out'
        }, '-=0.4')
        .from('.hero-cta', {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power3.out'
        }, '-=0.3')
        .from('.hero-trust', {
          opacity: 0,
          duration: 0.5,
          ease: 'power3.out'
        }, '-=0.2')
        .from('.scroll-indicator', {
          opacity: 0,
          y: -10,
          duration: 0.5,
          ease: 'power3.out'
        }, '-=0.2')

      // Problem 섹션 애니메이션
      gsap.from('.problem-title', {
        scrollTrigger: {
          trigger: problemRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 50,
        duration: 0.8
      })

      gsap.from('.problem-card', {
        scrollTrigger: {
          trigger: problemRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 60,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out'
      })

      // Solution 섹션 애니메이션
      gsap.from('.solution-title', {
        scrollTrigger: {
          trigger: solutionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 50,
        duration: 0.8
      })

      gsap.from('.solution-step', {
        scrollTrigger: {
          trigger: solutionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        x: -50,
        duration: 0.7,
        stagger: 0.2,
        ease: 'power3.out'
      })

      // Features 섹션 애니메이션
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 80,
        scale: 0.95,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out'
      })

      // Stats 카운터 애니메이션
      gsap.from('.stat-item', {
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.1
      })

      // CTA 섹션 애니메이션
      gsap.from('.cta-content', {
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 60,
        scale: 0.95,
        duration: 0.8,
        ease: 'power3.out'
      })

      // 패럴랙스 효과
      gsap.to('.parallax-bg', {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        },
        y: 200,
        ease: 'none'
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen bg-deep-black text-white overflow-x-hidden">
      {/* 배경 그라디언트 오버레이 */}
      <div className="fixed inset-0 bg-gradient-to-b from-cobalt-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Floating orbs 배경 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="parallax-bg absolute -top-40 -left-40 w-96 h-96 bg-cobalt-500/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="parallax-bg absolute top-1/3 -right-40 w-80 h-80 bg-neon-purple/15 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="parallax-bg absolute bottom-1/4 left-1/4 w-64 h-64 bg-neon-cyan/10 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-deep-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 bg-gradient-to-br from-cobalt-400 to-cobalt-600 rounded-xl flex items-center justify-center shadow-neon-blue">
                <span className="text-white text-lg font-bold">E</span>
                <div className="absolute inset-0 bg-cobalt-500 rounded-xl blur-md opacity-50 -z-10" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">EduBuilder Studio</h1>
                <p className="text-xs text-gray-500">AI 교육과정 설계</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="group relative px-5 py-2.5 bg-gradient-to-r from-cobalt-500 to-cobalt-600 text-white font-semibold rounded-lg overflow-hidden transition-all hover:shadow-neon-blue"
              >
                <span className="relative z-10">시작하기</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cobalt-400 to-cobalt-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cobalt-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cobalt-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-300">베타 서비스 오픈</span>
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>

            {/* Main Headline */}
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight mb-8">
              <span className="hero-title-line block text-white">교육과정 설계,</span>
              <span className="hero-title-line block mt-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cobalt-400 via-neon-cyan to-cobalt-400 animate-gradient bg-[length:200%_auto]">
                  AI가 3초면 끝
                </span>
              </span>
            </h2>

            {/* Subtitle */}
            <p className="hero-subtitle text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
              프리랜서 강사들을 위한 <span className="text-white font-semibold">AI 기반 교육과정 개발 플랫폼</span><br className="hidden sm:block" />
              베테랑의 지혜를 공유하고, 함께 성장하세요
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/signup"
                className="hero-cta group relative px-8 py-4 bg-gradient-to-r from-cobalt-500 to-cobalt-600 text-white text-lg font-bold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-glow flex items-center gap-2"
              >
                <span className="relative z-10">무료로 시작하기</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-cobalt-400 to-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="#demo"
                className="hero-cta px-8 py-4 bg-white/5 border border-white/10 text-white text-lg font-bold rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
              >
                데모 영상 보기
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="hero-trust flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>신용카드 등록 불필요</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>베타 기간 무료</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>즉시 사용 가능</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
          <span className="text-xs">스크롤하여 더 알아보기</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </section>

      {/* Problem Section */}
      <section ref={problemRef} className="relative py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="problem-title text-center mb-20">
              <span className="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-6">
                문제점
              </span>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
                교육과정 설계,<br />
                <span className="text-gray-500">왜 이렇게 힘들까요?</span>
              </h3>
            </div>

            {/* Problem Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="problem-card group p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-red-500/30 transition-all duration-300">
                <div className="h-14 w-14 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-red-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">시간 부족</h4>
                <p className="text-gray-400 leading-relaxed">
                  수업 준비에만 몇 시간씩 소요. 실제 교육 품질 향상에 쓸 시간이 없습니다.
                </p>
              </div>

              <div className="problem-card group p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-orange-500/30 transition-all duration-300">
                <div className="h-14 w-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-7 h-7 text-orange-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">체계 부재</h4>
                <p className="text-gray-400 leading-relaxed">
                  매번 처음부터 설계. 검증된 프레임워크나 템플릿 없이 혼자 고민합니다.
                </p>
              </div>

              <div className="problem-card group p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-yellow-500/30 transition-all duration-300">
                <div className="h-14 w-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileX className="w-7 h-7 text-yellow-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">참고 자료 부족</h4>
                <p className="text-gray-400 leading-relaxed">
                  다른 전문가의 노하우를 배울 기회가 없어 같은 실수를 반복합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section ref={solutionRef} className="relative py-32 bg-gradient-to-b from-transparent via-cobalt-900/10 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="solution-title text-center mb-20">
              <span className="inline-block px-4 py-1.5 bg-cobalt-500/10 border border-cobalt-500/20 rounded-full text-cobalt-400 text-sm font-medium mb-6">
                해결책
              </span>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
                3단계로 끝나는<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cobalt-400 to-neon-cyan">
                  스마트한 교육과정 설계
                </span>
              </h3>
            </div>

            {/* Solution Steps */}
            <div className="space-y-8">
              <div className="solution-step flex items-start gap-6 p-8 bg-gradient-to-r from-dark-card/80 to-transparent rounded-2xl border border-dark-border hover:border-cobalt-500/30 transition-all group">
                <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-cobalt-500 to-cobalt-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-neon-blue group-hover:scale-110 transition-transform">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Target className="w-6 h-6 text-cobalt-400" />
                    정보 입력
                  </h4>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    교육 대상, 주제, 목표, 시간만 입력하세요. 복잡한 양식 없이 간단한 질문에 답하면 됩니다.
                  </p>
                </div>
              </div>

              <div className="solution-step flex items-start gap-6 p-8 bg-gradient-to-r from-dark-card/80 to-transparent rounded-2xl border border-dark-border hover:border-neon-purple/30 transition-all group">
                <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-neon-purple to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-neon-purple group-hover:scale-110 transition-transform">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Brain className="w-6 h-6 text-neon-purple" />
                    AI 자동 설계
                  </h4>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    AI가 <span className="text-white font-semibold">3초 안에 3가지 맞춤형 교육과정</span>을 생성합니다. 베테랑 강사들의 데이터를 학습한 결과물입니다.
                  </p>
                </div>
              </div>

              <div className="solution-step flex items-start gap-6 p-8 bg-gradient-to-r from-dark-card/80 to-transparent rounded-2xl border border-dark-border hover:border-emerald-500/30 transition-all group">
                <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white group-hover:scale-110 transition-transform">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-emerald-400" />
                    선택 & 활용
                  </h4>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    마음에 드는 설계안을 선택하고, 관련 자료까지 추천받으세요. 바로 수업에 활용할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 bg-gold-400/10 border border-gold-400/20 rounded-full text-gold-400 text-sm font-medium mb-6">
                핵심 기능
              </span>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
                강사님을 위한<br />
                <span className="text-gray-500">완벽한 도구</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="feature-card group relative p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-cobalt-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cobalt-500/10 rounded-full blur-2xl group-hover:bg-cobalt-500/20 transition-colors" />
                <div className="relative">
                  <div className="h-16 w-16 bg-gradient-to-br from-cobalt-400 to-cobalt-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-neon-blue">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3">AI 설계 마법사</h4>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    학습 대상, 주제를 입력하면 AI가 <span className="text-cobalt-400 font-medium">최적의 교육과정을 3초 안에</span> 추천해드립니다.
                  </p>
                  <div className="flex items-center text-cobalt-400 font-medium group-hover:translate-x-2 transition-transform">
                    자세히 보기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="feature-card group relative p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-gold-400/50 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl group-hover:bg-gold-400/20 transition-colors" />
                <div className="relative">
                  <div className="h-16 w-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3">랭크 & 리워드</h4>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    콘텐츠 기여도에 따라 <span className="text-gold-400 font-medium">자동으로 랭크가 상승</span>하고, 다양한 리워드를 받으세요.
                  </p>
                  <div className="flex items-center text-gold-400 font-medium group-hover:translate-x-2 transition-transform">
                    자세히 보기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="feature-card group relative p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-emerald-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
                <div className="relative">
                  <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3">베테랑 라이브러리</h4>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    <span className="text-emerald-400 font-medium">경력 10년 이상 강사들의 검증된</span> 교육 자료를 활용할 수 있습니다.
                  </p>
                  <div className="flex items-center text-emerald-400 font-medium group-hover:translate-x-2 transition-transform">
                    자세히 보기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative py-20 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="stat-item text-center">
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cobalt-400 to-neon-cyan mb-2">
                  100+
                </div>
                <div className="text-gray-500 font-medium">베테랑 강사 자료</div>
              </div>
              <div className="stat-item text-center">
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-pink-400 mb-2">
                  10년+
                </div>
                <div className="text-gray-500 font-medium">평균 경력</div>
              </div>
              <div className="stat-item text-center">
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                  3초
                </div>
                <div className="text-gray-500 font-medium">AI 설계 생성</div>
              </div>
              <div className="stat-item text-center">
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-orange-400 mb-2">
                  80%
                </div>
                <div className="text-gray-500 font-medium">시간 절약</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-neon-purple/10 border border-neon-purple/20 rounded-full text-neon-purple text-sm font-medium mb-6">
                사용자 후기
              </span>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
                이미 많은 강사들이<br />
                <span className="text-gray-500">경험했습니다</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-cobalt-500/30 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 bg-gradient-to-br from-cobalt-400 to-cobalt-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                    김
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">김OO</div>
                    <div className="text-sm text-gray-500">코딩 강사 · 경력 8년</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed text-lg mb-6">
                  &ldquo;AI가 만들어준 교육과정이 제가 10년 경력으로 짜던 것보다 체계적이어서 놀랐습니다.
                  <span className="text-cobalt-400 font-semibold">시간이 80% 절약</span>되었어요!&rdquo;
                </p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gold-400 fill-gold-400" />
                  ))}
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                    박
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">박OO</div>
                    <div className="text-sm text-gray-500">메이커 교육 강사 · 경력 5년</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed text-lg mb-6">
                  &ldquo;다른 베테랑 선생님들의 자료를 참고할 수 있어서 너무 좋아요.
                  <span className="text-emerald-400 font-semibold">혼자 고민하던 시간이 확 줄었습니다</span>!&rdquo;
                </p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gold-400 fill-gold-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section ref={ctaRef} className="relative py-32">
        <div className="container mx-auto px-4">
          <div className="cta-content max-w-4xl mx-auto relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cobalt-500/20 via-neon-purple/20 to-cobalt-500/20 rounded-3xl blur-2xl" />

            <div className="relative bg-gradient-to-br from-dark-card to-dark-bg rounded-3xl border border-white/10 p-12 md:p-16 text-center overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-cobalt-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-neon-purple/20 rounded-full blur-3xl" />

              <div className="relative">
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
                  지금 바로 시작하세요
                </h3>
                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                  베타 기간 동안 <span className="text-white font-semibold">모든 기능을 무료</span>로 사용할 수 있습니다
                </p>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cobalt-500 to-cobalt-600 text-white text-xl font-bold rounded-xl hover:shadow-glow hover:scale-105 transition-all duration-300"
                >
                  <span>무료로 시작하기</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    신용카드 불필요
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    언제든 취소 가능
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-cobalt-400 to-cobalt-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">E</span>
                </div>
                <span className="text-gray-500 font-medium">EduBuilder Studio</span>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-500 text-sm">
                  © 2025 Education Builder Studio. All rights reserved.
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  에듀이노랩
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
