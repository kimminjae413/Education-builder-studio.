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
        .from('.hero-visual', {
          opacity: 0,
          y: 40,
          scale: 0.95,
          duration: 0.8,
          ease: 'power3.out'
        }, '-=0.4')
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

      // Problem 섹션 애니메이션 - 개별 요소 애니메이션으로 변경
      gsap.fromTo('.problem-title',
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: problemRef.current,
            start: 'top 90%',
          },
          opacity: 1,
          y: 0,
          duration: 0.6
        }
      )

      document.querySelectorAll('.problem-card').forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 30 },
          {
            scrollTrigger: {
              trigger: card,
              start: 'top 95%',
            },
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: i * 0.1
          }
        )
      })

      // Solution 섹션 애니메이션
      gsap.fromTo('.solution-title',
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: solutionRef.current,
            start: 'top 90%',
          },
          opacity: 1,
          y: 0,
          duration: 0.6
        }
      )

      document.querySelectorAll('.solution-step').forEach((step, i) => {
        gsap.fromTo(step,
          { opacity: 0, y: 30 },
          {
            scrollTrigger: {
              trigger: step,
              start: 'top 95%',
            },
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: i * 0.1
          }
        )
      })

      // Features 섹션 애니메이션
      document.querySelectorAll('.feature-card').forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 30 },
          {
            scrollTrigger: {
              trigger: card,
              start: 'top 95%',
            },
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: i * 0.1
          }
        )
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
      {/* 레이어 1: 그리드 패턴 배경 */}
      <div className="fixed inset-0 bg-grid-dots pointer-events-none" />

      {/* 레이어 2: 그라데이션 메시 */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* 레이어 3: 상단 그라데이션 오버레이 */}
      <div className="fixed inset-0 bg-gradient-to-b from-cobalt-900/30 via-transparent to-deep-black/50 pointer-events-none" />

      {/* 레이어 4: Floating orbs 배경 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="parallax-bg absolute -top-40 -left-40 w-[500px] h-[500px] bg-cobalt-500/20 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="parallax-bg absolute top-1/4 -right-20 w-[400px] h-[400px] bg-cobalt-400/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="parallax-bg absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-cobalt-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* 레이어 5: 노이즈 텍스처 오버레이 */}
      <div className="fixed inset-0 bg-noise pointer-events-none" />

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
                className="group relative px-3 sm:px-5 py-2.5 bg-gradient-to-r from-cobalt-500 to-cobalt-600 text-white font-semibold rounded-lg overflow-hidden transition-all hover:shadow-neon-blue whitespace-nowrap"
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
                  AI가 3분면 끝
                </span>
              </span>
            </h2>

            {/* 레고 스타일 자율주행 애니메이션 */}
            <div className="hero-visual relative w-full max-w-2xl mx-auto h-48 mb-12 overflow-hidden">
              {/* 트랙/도로 */}
              <div className="absolute bottom-8 left-0 right-0 h-16">
                {/* 도로 배경 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark-card to-transparent rounded-full" />
                {/* 도로 라인 (점선) */}
                <div className="absolute top-1/2 left-0 right-0 h-1 flex items-center justify-center gap-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-8 h-1 bg-cobalt-500/30 rounded-full" />
                  ))}
                </div>
                {/* 트랙 포인트들 */}
                <div className="absolute top-1/2 -translate-y-1/2 left-[10%] w-3 h-3 bg-cobalt-400 rounded-full animate-pulse" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[30%] w-3 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 -translate-y-1/2 left-[50%] w-3 h-3 bg-cobalt-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 -translate-y-1/2 left-[70%] w-3 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
                <div className="absolute top-1/2 -translate-y-1/2 left-[90%] w-3 h-3 bg-cobalt-500 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
              </div>

              {/* 레고 스타일 자동차 */}
              <div className="absolute bottom-12 animate-[driveAcross_8s_ease-in-out_infinite]">
                <div className="relative">
                  {/* 자동차 본체 (레고 블록 스타일) */}
                  <div className="relative">
                    {/* 상단 블록 */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-6 bg-gradient-to-b from-cobalt-400 to-cobalt-500 rounded-t-lg border-2 border-cobalt-300">
                      {/* 레고 스터드 */}
                      <div className="absolute -top-1 left-1 w-2 h-2 bg-cobalt-300 rounded-full" />
                      <div className="absolute -top-1 right-1 w-2 h-2 bg-cobalt-300 rounded-full" />
                    </div>
                    {/* 메인 바디 */}
                    <div className="w-14 h-8 bg-gradient-to-b from-cobalt-500 to-cobalt-600 rounded-lg border-2 border-cobalt-400 flex items-center justify-center gap-1">
                      {/* 센서 라이트 */}
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_rgba(0,243,255,0.8)]" style={{ animationDelay: '0.3s' }} />
                    </div>
                    {/* 바퀴 */}
                    <div className="absolute -bottom-2 left-0 w-4 h-4 bg-gray-700 rounded-full border-2 border-gray-500 animate-[spin_0.5s_linear_infinite]">
                      <div className="absolute inset-1 bg-gray-600 rounded-full" />
                    </div>
                    <div className="absolute -bottom-2 right-0 w-4 h-4 bg-gray-700 rounded-full border-2 border-gray-500 animate-[spin_0.5s_linear_infinite]">
                      <div className="absolute inset-1 bg-gray-600 rounded-full" />
                    </div>
                  </div>
                  {/* 센서 빔 */}
                  <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-1 bg-gradient-to-r from-cobalt-400/80 to-transparent animate-pulse" />
                  <div className="absolute -right-12 top-1/3 w-12 h-0.5 bg-gradient-to-r from-emerald-400/60 to-transparent rotate-12 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="absolute -right-12 bottom-1/3 w-12 h-0.5 bg-gradient-to-r from-emerald-400/60 to-transparent -rotate-12 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              {/* 플로팅 코드 블록들 */}
              <div className="absolute top-4 left-[5%] animate-float" style={{ animationDelay: '0s' }}>
                <div className="px-3 py-1.5 bg-dark-card/90 border border-cobalt-500/30 rounded-lg font-mono text-xs text-cobalt-400 backdrop-blur-sm">
                  if(obstacle)
                </div>
              </div>
              <div className="absolute top-8 left-[25%] animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="px-3 py-1.5 bg-dark-card/90 border border-emerald-500/30 rounded-lg font-mono text-xs text-emerald-400 backdrop-blur-sm">
                  turn_left()
                </div>
              </div>
              <div className="absolute top-2 right-[30%] animate-float" style={{ animationDelay: '1s' }}>
                <div className="px-3 py-1.5 bg-dark-card/90 border border-cobalt-500/30 rounded-lg font-mono text-xs text-cobalt-400 backdrop-blur-sm">
                  speed = 50
                </div>
              </div>
              <div className="absolute top-10 right-[10%] animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="px-3 py-1.5 bg-dark-card/90 border border-emerald-500/30 rounded-lg font-mono text-xs text-emerald-400 backdrop-blur-sm">
                  go_forward()
                </div>
              </div>

              {/* 장애물 블록 (레고 스타일) */}
              <div className="absolute bottom-8 left-[45%] w-6 h-10 bg-gradient-to-b from-red-400 to-red-500 rounded border-2 border-red-300">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-300 rounded-full" />
              </div>
            </div>

            {/* Subtitle */}
            <p className="hero-subtitle text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
              프리랜서 강사들을 위한 <span className="text-white font-semibold">AI 기반 교육과정 개발 플랫폼</span><br className="hidden sm:block" />
              베테랑의 지혜를 공유하고, 함께 성장하세요
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/signup"
                className="hero-cta group relative px-8 py-4 bg-gradient-to-r from-cobalt-500 to-cobalt-600 text-white text-lg font-bold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 btn-shimmer btn-glow-pulse flex items-center gap-2"
              >
                <span className="relative z-10">무료로 시작하기</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-cobalt-400 to-cobalt-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="#demo"
                className="hero-cta group relative px-8 py-4 bg-white/5 border border-white/10 text-white text-lg font-bold rounded-xl hover:bg-white/10 hover:border-cobalt-500/50 transition-all duration-300 backdrop-blur-sm overflow-hidden"
              >
                <span className="relative z-10">데모 영상 보기</span>
                {/* Subtle shimmer on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cobalt-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
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

        {/* Scroll Indicator - Mouse Animation */}
        <div className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <span className="text-xs text-gray-500 tracking-wider uppercase">Scroll</span>
          {/* Mouse Icon */}
          <div className="relative w-6 h-10 border-2 border-gray-500/50 rounded-full flex justify-center">
            {/* Scroll Wheel/Dot */}
            <div className="absolute top-2 w-1.5 h-1.5 bg-cobalt-400 rounded-full animate-[scrollDown_1.5s_ease-in-out_infinite]" />
          </div>
          {/* Arrow Lines */}
          <div className="flex flex-col items-center gap-1 -mt-1">
            <ChevronDown className="w-4 h-4 text-gray-500/50 animate-[fadeDown_1.5s_ease-in-out_infinite]" />
            <ChevronDown className="w-4 h-4 text-gray-500/30 -mt-2 animate-[fadeDown_1.5s_ease-in-out_infinite_0.15s]" />
          </div>
        </div>
      </section>

      {/* Problem Section - 2 Core Problems */}
      <section ref={problemRef} className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="problem-title text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-4">
                교육 현장의 문제
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white">
                프리랜서 강사들이 직면한 <span className="text-red-400">2가지 난관</span>
              </h3>
            </div>

            {/* Two Core Problem Cards - Side by Side */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Problem 1 - 교육과정 설계 역량 부족 */}
              <div className="problem-card group relative p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-red-500/40 transition-all duration-300 overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors -z-10" />

                <div className="relative z-10">
                  {/* Icon & Number */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-7 h-7 text-red-400" />
                    </div>
                    <span className="text-5xl font-black text-red-500/20">01</span>
                  </div>

                  <h4 className="text-xl font-bold text-white mb-4">교육과정 설계 역량 부족</h4>

                  {/* Sub-problems */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-sm leading-relaxed">
                        수업 준비에만 <span className="text-white font-medium">몇 시간씩 소요</span>, 정작 교육 품질 향상에 쓸 시간이 없음
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileX className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-sm leading-relaxed">
                        검증된 프레임워크나 템플릿 없이 <span className="text-white font-medium">매번 처음부터 설계</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-sm leading-relaxed">
                        다른 전문가의 노하우를 배울 기회가 없어 <span className="text-white font-medium">같은 실수 반복</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem 2 - 베테랑 경험 자산의 소멸 */}
              <div className="problem-card group relative p-8 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-orange-500/40 transition-all duration-300 overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors -z-10" />

                <div className="relative z-10">
                  {/* Icon & Number */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Trophy className="w-7 h-7 text-orange-400" />
                    </div>
                    <span className="text-5xl font-black text-orange-500/20">02</span>
                  </div>

                  <h4 className="text-xl font-bold text-white mb-4">베테랑 경험 자산의 소멸</h4>

                  {/* Sub-problems */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-sm leading-relaxed">
                        10년 이상 축적된 <span className="text-white font-medium">교육 노하우가 체계화되지 않음</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-sm leading-relaxed">
                        경험 공유에 대한 <span className="text-white font-medium">정당한 보상 체계 부재</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-sm leading-relaxed">
                        은퇴 시 <span className="text-white font-medium">귀중한 교육 자산이 함께 사라짐</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transition Arrow */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center text-gray-500">
                <ChevronDown className="w-6 h-6 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Integrated Platform */}
      <section ref={solutionRef} className="relative py-16 bg-gradient-to-b from-cobalt-900/5 via-cobalt-900/10 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="solution-title text-center mb-10">
              <span className="inline-block px-4 py-1.5 bg-cobalt-500/10 border border-cobalt-500/20 rounded-full text-cobalt-400 text-sm font-medium mb-4">
                EduBuilder Studio의 해결책
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
                AI 기반 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cobalt-400 to-neon-cyan">교육과정 설계</span> +{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-orange-400">경험 자산화</span> 플랫폼
              </h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                신규 강사는 빠르게 성장하고, 베테랑 강사는 경험을 자산화하여 지속적인 수익을 창출합니다
              </p>
            </div>

            {/* Solution Flow - 3 Steps Horizontal */}
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              <div className="solution-step group p-6 bg-gradient-to-br from-dark-card/90 to-dark-bg rounded-xl border border-dark-border hover:border-cobalt-500/40 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-cobalt-500 to-cobalt-600 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-neon-blue group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <h4 className="text-lg font-bold text-white">정보 입력</h4>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  교육 대상, 주제, 목표만 입력하면 끝
                </p>
              </div>

              <div className="solution-step group p-6 bg-gradient-to-br from-dark-card/90 to-dark-bg rounded-xl border border-dark-border hover:border-neon-purple/40 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-neon-purple to-purple-600 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-neon-purple group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <h4 className="text-lg font-bold text-white">AI 자동 설계</h4>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  <span className="text-white font-medium">3분 안에 3가지</span> 맞춤형 교육과정 생성
                </p>
              </div>

              <div className="solution-step group p-6 bg-gradient-to-br from-dark-card/90 to-dark-bg rounded-xl border border-dark-border hover:border-emerald-500/40 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-lg font-black text-white group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <h4 className="text-lg font-bold text-white">선택 & 활용</h4>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  설계안 선택 후 <span className="text-white font-medium">바로 수업에 활용</span>
                </p>
              </div>
            </div>

            {/* AI Core Animation - Smaller */}
            <div className="relative h-48 w-full max-w-sm mx-auto mb-8">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-2 border-dashed border-cobalt-500/30 animate-[spin_20s_linear_infinite]"></div>
              </div>
              {/* Middle rotating ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-2 border-cobalt-400/40 animate-[spin_15s_linear_infinite_reverse]"></div>
              </div>
              {/* Inner pulsing core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cobalt-500 to-neon-cyan animate-pulse shadow-neon-blue"></div>
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-cobalt-500/50 animate-ping"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              {/* Orbiting elements */}
              <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-neon-cyan rounded-full shadow-neon-cyan"></div>
              </div>
              <div className="absolute inset-0 animate-[spin_8s_linear_infinite_reverse]">
                <div className="absolute bottom-4 right-8 w-2 h-2 bg-gold-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - 4 Core Features */}
      <section ref={featuresRef} className="relative py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-cobalt-500/10 border border-cobalt-500/20 rounded-full text-cobalt-400 text-sm font-medium mb-4">
                핵심 기능
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white">
                신규 강사와 베테랑 강사 <span className="text-gray-500">모두를 위한</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Feature 1 - AI 설계 마법사 */}
              <div className="feature-card group relative p-6 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-cobalt-500/50 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cobalt-500/5 rounded-full blur-2xl group-hover:bg-cobalt-500/15 transition-colors -z-10" />
                <div className="relative z-10 flex gap-5">
                  <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-cobalt-400 to-cobalt-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all shadow-neon-blue">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">AI 설계 마법사</h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">
                      Gemini API 기반 <span className="text-cobalt-400 font-medium">맞춤형 교육과정</span>을 3분 안에 자동 생성
                    </p>
                    <div className="flex items-center text-cobalt-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                      자세히 보기 <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 - 경험 금고 (Experience Vault) */}
              <div className="feature-card group relative p-6 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-colors -z-10" />
                <div className="relative z-10 flex gap-5">
                  <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">경험 금고 & 지혜 도서관</h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">
                      베테랑 강사의 <span className="text-emerald-400 font-medium">검증된 교육 자료</span>를 탐색하고 활용
                    </p>
                    <div className="flex items-center text-emerald-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                      자세히 보기 <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 - 랭크 & 리워드 */}
              <div className="feature-card group relative p-6 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-gold-400/50 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full blur-2xl group-hover:bg-gold-400/15 transition-colors -z-10" />
                <div className="relative z-10 flex gap-5">
                  <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">랭크 & 리워드</h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">
                      기여도 기반 <span className="text-gold-400 font-medium">자동 랭크 상승</span>과 다양한 보상 혜택
                    </p>
                    <div className="flex items-center text-gold-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                      자세히 보기 <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4 - 콘텐츠 마켓플레이스 */}
              <div className="feature-card group relative p-6 bg-gradient-to-br from-dark-card to-dark-bg rounded-2xl border border-dark-border hover:border-neon-purple/50 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-2xl group-hover:bg-neon-purple/15 transition-colors -z-10" />
                <div className="relative z-10 flex gap-5">
                  <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-neon-purple to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">콘텐츠 마켓플레이스</h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">
                      교육 자료 <span className="text-neon-purple font-medium">거래 및 수익화</span>로 지속적인 소득 창출
                    </p>
                    <div className="flex items-center text-neon-purple text-sm font-medium group-hover:translate-x-2 transition-transform">
                      자세히 보기 <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
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
                  3분
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
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cobalt-500 to-cobalt-600 text-white text-xl font-bold rounded-xl hover:scale-105 transition-all duration-300 btn-shimmer btn-glow-pulse overflow-hidden"
                >
                  <span className="relative z-10">무료로 시작하기</span>
                  <ArrowRight className="relative z-10 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
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
                  © 2026 Education Builder Studio. All rights reserved.
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
