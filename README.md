# Education Builder Studio (EBS)

**지혜를 설계하고, 경험을 공유하며, 교육의 미래를 함께 짓다**

## 프로젝트 개요

Education Builder Studio는 프리랜서 강사들을 위한 AI 기반 교육과정 개발 지원 및 공유 플랫폼입니다.

### 핵심 기능

1. **AI 교육과정 설계 마법사** - Gemini API 기반 맞춤형 교육과정 추천
2. **RAG 기반 교육과정 생성** - 베테랑 강사 자료 기반 벡터 검색 + AI 생성
3. **베테랑 콘텐츠 라이브러리** - 경험 있는 강사들의 자료 공유
4. **랭크 & 리워드 시스템** - 기여도 기반 자동 보상
5. **콘텐츠 마켓플레이스** - 교육 자료 거래 및 수익화

## 기술 스택

- **Frontend**: Next.js 15.5.9 (App Router), React 19, TypeScript, Tailwind CSS
- **Authentication**: Firebase Auth (이메일/비밀번호)
- **Database**: Cloud SQL PostgreSQL (pgvector)
- **Storage**: Google Cloud Storage
- **AI**: Google Gemini 2.0 Flash (생성), Gemini text-embedding-004 (임베딩)
- **Deployment**: Netlify

## 브랜드 컬러 (코발트 블루)

- Primary: `#0066FF` (cobalt-500)
- Secondary: `#FFB020` (gold-400 - 리워드)
- Success: `#10B981` (green-500)

## 프로젝트 구조

```
edubuilder-studio/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 관련 (로그인/회원가입)
│   │   ├── (dashboard)/       # 강사 대시보드
│   │   ├── (admin)/           # 관리자 전용
│   │   └── api/               # API Routes
│   ├── components/            # React 컴포넌트
│   │   ├── admin/            # 관리자 컴포넌트
│   │   ├── rank/             # 랭크 시스템
│   │   └── ui/               # 공통 UI
│   └── lib/                   # 유틸리티
│       ├── firebase/         # Firebase Auth (클라이언트/Admin)
│       ├── db/               # Cloud SQL PostgreSQL 연결
│       ├── storage/          # Google Cloud Storage
│       ├── rag/              # RAG 파이프라인 (chunker/embedder/retriever/generator)
│       ├── ai/               # AI 기능 (multi-generator, classifier, constraint-extractor)
│       ├── reward/           # 리워드 시스템
│       ├── marketplace/      # 마켓플레이스
│       └── utils/            # 파일 파서 등 유틸리티
└── public/                   # 정적 파일
```

## 개발 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Firebase (Admin)
FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Cloud SQL (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# Google Cloud Storage
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=education-builder-materials
GCS_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Google AI
GEMINI_API_KEY=your-gemini-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 데이터베이스 초기화

개발 환경에서 다음 setup API를 순서대로 호출하세요:

1. `/api/setup-db` - 기본 테이블 생성
2. `/api/setup-profile` - 프로필 테이블
3. `/api/setup-chunks-table` - RAG 청크 테이블
4. `/api/setup-feedback-table` - 피드백 테이블
5. `/api/setup-reward-tables` - 리워드 테이블

> 주의: setup API는 개발 환경에서만 접근 가능합니다.

## 지원 파일 형식

| 형식 | 확장자 | 파서 라이브러리 |
|------|--------|----------------|
| PDF | .pdf | `pdf-parse` |
| Word | .docx | `mammoth` |
| PowerPoint | .pptx | `jszip` + `xml2js` |
| 한글 | .hwp | `hwp.js` |
| 엑셀 | .xlsx, .xls | `xlsx` (SheetJS) |

## 배포

- **URL**: https://educationbuilderstudio.netlify.app/
- **플랫폼**: Netlify
- **설정 파일**: `netlify.toml`

## 라이선스

Proprietary - 에듀이노랩

## 문의

- 대표: 송인상
- 이메일: contact@edubuilder.studio
