# Education Builder Studio (EBS)

**지혜를 설계하고, 경험을 공유하며, 교육의 미래를 함께 짓다**

## 프로젝트 개요

Education Builder Studio는 프리랜서 강사들을 위한 AI 기반 교육과정 개발 지원 및 공유 플랫폼입니다.

### 핵심 기능

1. **AI 교육과정 설계 마법사** - Gemini API 기반 맞춤형 교육과정 추천
2. **베테랑 콘텐츠 라이브러리** - 경험 있는 강사들의 자료 공유
3. **랭크 & 리워드 시스템** - 기여도 기반 자동 보상
4. **콘텐츠 마켓플레이스** - 교육 자료 거래 및 수익화

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **AI**: Google Gemini API, LangChain
- **Deployment**: Vercel

## 브랜드 컬러 (코발트 블루)

- Primary: `#0066FF` (cobalt-500)
- Secondary: `#FFB020` (gold-400 - 리워드)
- Success: `#10B981` (green-500)

## 프로젝트 구조

```
edubuilder-studio/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 관련
│   │   ├── (dashboard)/       # 강사 대시보드
│   │   ├── (admin)/           # 관리자 전용
│   │   └── api/               # API Routes
│   ├── components/            # React 컴포넌트
│   │   ├── admin/            # 관리자 컴포넌트
│   │   ├── rank/             # 랭크 시스템
│   │   └── ui/               # 공통 UI
│   └── lib/                   # 유틸리티
│       ├── rank/             # 랭크 계산 로직
│       └── supabase/         # Supabase 클라이언트
├── supabase/
│   └── migrations/           # DB 마이그레이션
└── public/                   # 정적 파일
```

## 개발 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 마이그레이션 실행

```bash
npx supabase db push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 주요 일정

- **Week 1-2**: 환경 설정 & 브랜드 구축
- **Week 3-4**: 인증 & 역할 시스템
- **Week 5-6**: AI 설계 마법사
- **Week 7-8**: 콘텐츠 라이브러리
- **Week 9-10**: 랭크 & 리워드 시스템
- **Week 11-12**: 관리자 기능 & 배포

## 라이선스

Proprietary - 에듀이노랩

## 문의

- 대표: 송인상
- 이메일: contact@edubuilder.studio
