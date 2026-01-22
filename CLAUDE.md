# CLAUDE.md - 프로젝트 진행 기록

## 프로젝트 개요
- **프로젝트명**: Education Builder Studio (EBS)
- **설명**: 프리랜서 강사들을 위한 AI 기반 교육과정 개발 지원 및 공유 플랫폼
- **기술 스택**: Next.js 15.5.9, React 19, TypeScript, Tailwind CSS, Supabase, Google Gemini API
- **배포 URL**: https://educationbuilderstudio.netlify.app/

---

## 2026-01-22 작업 내역

### 1. 랜딩 페이지 Hero 섹션 개선
- [x] 배경 효과 추가 (노이즈, 그리드, 메시 패턴)
- [x] 레고 스타일 자율주행 애니메이션 추가
- [x] CTA 버튼 shimmer/glow 효과 추가
- [x] 스크롤 인디케이터 마우스 애니메이션으로 변경

### 2. 랜딩 페이지 섹션 재디자인 (사업계획서 기반)
- [x] 문제점 섹션: 3개 → 2개 핵심 문제로 통합
  - 문제 01: 교육과정 설계 역량 부족
  - 문제 02: 베테랑 경험 자산의 소멸
- [x] 해결책 섹션: 3단계 가로 배열 + AI 애니메이션
- [x] 핵심 기능 섹션: 3개 → 4개 기능으로 확장
  - AI 설계 마법사
  - 경험 금고 & 지혜 도서관
  - 랭크 & 리워드
  - 콘텐츠 마켓플레이스
- [x] 섹션 간 간격 축소 (py-32 → py-20/py-16)

### 3. 버그 수정
- [x] Next.js 보안 취약점 수정 (15.1.5 → 15.5.9)
- [x] z-index 레이어링 문제 수정 (카드 콘텐츠 가시성)
- [x] GSAP 애니메이션 수정
  - `toggleActions: 'reverse'` 제거 (스크롤 시 요소 숨김 방지)
  - stagger 대신 개별 요소 애니메이션으로 변경
  - 각 요소마다 자체 ScrollTrigger 적용

### 4. 콘텐츠 수정
- [x] AI 생성 시간 변경: "3초" → "3분" (현실적인 시간)

### 5. 파비콘 추가
- [x] 코발트 블루 그라데이션 + 흰색 "E" 로고 SVG 파비콘 생성
- [x] layout.tsx 메타데이터 업데이트

---

## 알려진 이슈
- Supabase 환경 변수 미설정 시 로컬 개발 서버 에러 발생

---

## Git 커밋 히스토리 (최근)
- `f35d033` - Add favicon with E logo in cobalt blue gradient
- `d146b55` - Change AI generation time from 3초 to 3분
- `a75e00f` - Fix GSAP animation - use individual element triggers
- `22fad81` - Fix GSAP animations - prevent elements from hiding on scroll
- `032a483` - Fix z-index layering for card content visibility
- `8695c69` - Redesign landing page sections below hero animation

---

## 참고 문서
- 사업계획서: K-Startup 2025 지원용 (document_pdf.pdf)
- 브랜드 컬러: Cobalt Blue (#0066FF)
