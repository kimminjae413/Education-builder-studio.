# CLAUDE.md - Education Builder Studio 개발 가이드

## 프로젝트 개요

- **프로젝트명**: Education Builder Studio (EBS)
- **슬로건**: "지혜를 설계하고, 경험을 공유하며, 교육의 미래를 함께 짓다"
- **핵심 철학**: 지식과 지혜의 공유, 존중, 보상, 순환을 실현하는 교육 생태계
- **기술 스택**: Next.js 15, React 19, TypeScript, Tailwind CSS, Firebase Auth, Cloud SQL (PostgreSQL), Google Cloud Storage, Gemini File Search API, Google Gemini API
- **배포 URL**: https://educationbuilderstudio.netlify.app/

---

## 참조 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| 특허 명세서 | `P20250516KR_명세서_에듀이노랩_교육과정 생성 시스템 (2).docx` | AI 기반 교육과정 개발 지원 시스템 특허 출원 명세서 |
| 사업계획서 | `document_pdf.pdf` | K-Startup 2025 혁신창업리그 지원용 사업계획서 |

---

## 핵심 시스템: RAG 기반 교육과정 생성

### 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                 RAG 기반 교육과정 생성 시스템                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    1. 자료 업로드 (헬퍼/베테랑 강사)            │    │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │    │
│  │  │ PDF │ │DOCX │ │ HWP │ │PPTX │ │XLSX │                  │    │
│  │  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘                  │    │
│  │     └───────┴───────┴───────┴───────┘                      │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              2. Google Cloud Storage 저장                    │    │
│  │                    (원본 파일 보관)                           │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              3. 문서 파싱 & 텍스트 추출                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │    │
│  │  │pdf-parse │ │ mammoth  │ │hwp-parser│ │  xlsx    │      │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              4. 청킹 (Chunking)                              │    │
│  │         긴 문서를 의미 단위로 분할 (500-1000 토큰)             │    │
│  │     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │    │
│  │     │Chunk│ │Chunk│ │Chunk│ │Chunk│ │Chunk│ ...          │    │
│  │     │  1  │ │  2  │ │  3  │ │  4  │ │  5  │              │    │
│  │     └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              5. 임베딩 생성                                   │    │
│  │           Gemini text-embedding-004                          │    │
│  │     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │    │
│  │     │ Vec │ │ Vec │ │ Vec │ │ Vec │ │ Vec │ ...          │    │
│  │     │  1  │ │  2  │ │  3  │ │  4  │ │  5  │              │    │
│  │     └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              6. 벡터 DB 저장                                  │    │
│  │           Supabase pgvector                                  │    │
│  │     document_chunks 테이블 (chunk_id, content, embedding)    │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            │                                        │
│ ═══════════════════════════╪════════════════════════════════════   │
│                            │                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         7. 사용자 요청 (교육과정 설계 요청)                    │    │
│  │     교육 목표 / 교육 대상 / 교육 진행 상황 입력                 │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              8. RAG 검색 (Retrieval)                         │    │
│  │     사용자 요청 임베딩 → 유사 청크 검색 (Top-K)                │    │
│  │     ┌─────────────────────────────────────────┐            │    │
│  │     │ 관련 청크 1: "아두이노 기초 수업에서..."    │            │    │
│  │     │ 관련 청크 2: "중학생 대상 코딩 수업시..."   │            │    │
│  │     │ 관련 청크 3: "8차시 구성 예시..."         │            │    │
│  │     └─────────────────────────────────────────┘            │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              9. LLM 생성 (Augmented Generation)              │    │
│  │     Gemini 2.0 Flash + 검색된 컨텍스트                        │    │
│  │     ┌─────────────────────────────────────────┐            │    │
│  │     │ 프롬프트:                                 │            │    │
│  │     │ - 사용자 요청 (목표, 대상, 조건)            │            │    │
│  │     │ - 검색된 관련 자료 (RAG 컨텍스트)          │            │    │
│  │     │ - 출력 형식 지정                          │            │    │
│  │     └─────────────────────────────────────────┘            │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              10. 결과물 생성                                  │    │
│  │     ┌──────────────┐  ┌──────────────┐                     │    │
│  │     │   제안서      │  │   교육안      │                     │    │
│  │     │ (Proposal)   │  │ (Lesson Plan)│                     │    │
│  │     └──────────────┘  └──────────────┘                     │    │
│  │     + 참조한 원본 자료 출처 표시                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 지원 파일 형식

| 형식 | 확장자 | 파서 라이브러리 | 상태 |
|------|--------|----------------|------|
| PDF | .pdf | `pdf-parse` | ✅ 구현됨 |
| Word | .docx | `mammoth` | ✅ 구현됨 |
| PowerPoint | .pptx | `jszip` + `xml2js` | ✅ 구현됨 |
| **한글** | .hwp | `hwp.js` | ✅ 구현됨 |
| **엑셀** | .xlsx, .xls | `xlsx` (SheetJS) | ✅ 구현됨 |

---

## 현재 구현 상태

### ✅ 완성된 기능

| 기능 | 설명 |
|------|------|
| 사용자 인증 | Firebase Auth 기반 (이메일/비밀번호) |
| 데이터베이스 | Cloud SQL PostgreSQL |
| 파일 저장소 | Google Cloud Storage |
| AI 설계 마법사 | 4단계 위저드 (단일 설계안) |
| 파일 업로드 | PDF, DOCX, PPTX 파싱 |
| 랭크 시스템 | 6단계 자동 포인트 계산 |
| 기본 벡터 검색 | 단일 임베딩 기반 추천 |
| Gemini RAG | Gemini File API 기반 RAG 준비 |

### ❌ 구현 필요 (RAG 시스템)

| 기능 | 우선순위 | 설명 |
|------|---------|------|
| ~~Google Cloud Storage 연동~~ | ~~⭐⭐⭐~~ | ✅ 완료 |
| ~~HWP 파서~~ | ~~⭐⭐⭐~~ | ✅ 완료 (hwp.js) |
| ~~XLSX 파서~~ | ~~⭐⭐⭐~~ | ✅ 완료 (SheetJS) |
| 문서 청킹 시스템 | ⭐⭐⭐ | 긴 문서를 의미 단위로 분할 |
| 청크별 임베딩 저장 | ⭐⭐⭐ | document_chunks 테이블 |
| RAG 검색 파이프라인 | ⭐⭐⭐ | 유사 청크 검색 (Top-K) |
| RAG 기반 생성 | ⭐⭐⭐ | 검색 컨텍스트 + LLM |
| 복수 설계안 생성 | ⭐⭐ | 3개 이상 설계안 |
| 제약 조건 도출부 | ⭐⭐ | 입력에서 제약조건 추출 |
| 리워드 분배 시스템 | ⭐ | 상위 10명 보상 |

---

## 개발 로드맵

### Phase 1: RAG 인프라 구축 - 1주

#### 1.1 Google Cloud Storage 연동
```
신규 파일:
├── src/lib/storage/gcs.ts
│   ├── uploadFile(file, path) → url
│   ├── downloadFile(path) → buffer
│   ├── deleteFile(path) → boolean
│   └── getSignedUrl(path, expiry) → url
│
└── 환경 변수 추가
    ├── GCS_PROJECT_ID
    ├── GCS_BUCKET_NAME
    └── GCS_SERVICE_ACCOUNT_KEY (JSON)
```

**예상 소요**: 1일

#### 1.2 HWP 파서 추가
```
신규 파일:
├── src/lib/parsers/hwp-parser.ts
│   └── parseHWP(buffer) → { text, metadata }
│
└── 사용 라이브러리 옵션
    ├── hwp.js (npm) - 기본 텍스트 추출
    ├── hwpx-parser - HWPX (신버전) 지원
    └── 또는 Python 서버 연동 (olefile 기반)
```

**예상 소요**: 1-2일

#### 1.3 XLSX 파서 추가
```
신규 파일:
├── src/lib/parsers/xlsx-parser.ts
│   └── parseXLSX(buffer) → { sheets: [{name, data}], metadata }
│
└── npm install xlsx (SheetJS)
```

**예상 소요**: 0.5일

#### 1.4 통합 파일 파서
```
src/lib/parsers/index.ts 수정
├── parseFile(buffer, mimeType) → ParseResult
│   ├── application/pdf → parsePDF()
│   ├── application/vnd.openxmlformats-officedocument.wordprocessingml.document → parseDOCX()
│   ├── application/vnd.openxmlformats-officedocument.presentationml.presentation → parsePPTX()
│   ├── application/haansofthwp → parseHWP()  // 신규
│   ├── application/x-hwp → parseHWP()        // 신규
│   └── application/vnd.openxmlformats-officedocument.spreadsheetml.sheet → parseXLSX()  // 신규
│
└── ParseResult 타입
    {
      text: string,
      chunks: string[],        // 사전 청킹된 텍스트
      metadata: {
        pageCount?: number,
        sheetCount?: number,
        imageCount?: number,
        tableCount?: number
      }
    }
```

**예상 소요**: 0.5일

---

### Phase 2: 청킹 & 임베딩 시스템 - 1주

#### 2.1 문서 청킹 시스템
```
신규 파일:
├── src/lib/rag/chunker.ts
│   ├── chunkText(text, options) → Chunk[]
│   │   └── options: { chunkSize: 500, overlap: 50, separator: '\n\n' }
│   │
│   ├── chunkByParagraph(text) → Chunk[]
│   │   └── 문단 단위 분할
│   │
│   ├── chunkBySentence(text, maxTokens) → Chunk[]
│   │   └── 문장 단위 분할 (토큰 제한)
│   │
│   └── chunkBySection(text) → Chunk[]
│       └── 섹션/제목 기준 분할
│
└── Chunk 타입
    {
      id: string,
      content: string,
      metadata: {
        documentId: string,
        chunkIndex: number,
        startChar: number,
        endChar: number,
        tokenCount: number
      }
    }
```

**예상 소요**: 2일

#### 2.2 청크 임베딩 & 저장
```
신규 파일:
├── src/lib/rag/embedder.ts
│   ├── embedChunks(chunks) → EmbeddedChunk[]
│   │   └── Gemini text-embedding-004 사용
│   │   └── 배치 처리 (한번에 100개씩)
│   │
│   └── embedQuery(query) → number[]
│       └── 검색 쿼리 임베딩
│
└── 데이터베이스 테이블
    document_chunks:
    ├── id: UUID
    ├── document_id: UUID (FK → teaching_materials)
    ├── chunk_index: INTEGER
    ├── content: TEXT
    ├── token_count: INTEGER
    ├── embedding: VECTOR(768)
    ├── metadata: JSONB
    └── created_at: TIMESTAMP
```

**예상 소요**: 2일

#### 2.3 업로드 파이프라인 수정
```
src/app/api/materials/upload/route.ts 수정

업로드 플로우:
1. 파일 검증
2. Google Cloud Storage 업로드 (원본 보관)
3. 파일 파싱 (텍스트 추출)
4. 문서 청킹
5. 청크별 임베딩 생성
6. teaching_materials 저장 (메타데이터)
7. document_chunks 저장 (청크 + 임베딩)
```

**예상 소요**: 1일

---

### Phase 3: RAG 검색 & 생성 - 1주

#### 3.1 RAG 검색 엔진
```
신규 파일:
├── src/lib/rag/retriever.ts
│   ├── searchSimilarChunks(query, options) → RetrievalResult[]
│   │   └── options: { topK: 10, minScore: 0.7, filters: {} }
│   │
│   ├── rerankResults(results, query) → RetrievalResult[]
│   │   └── Cross-encoder 또는 LLM 기반 재순위
│   │
│   └── buildContext(results) → string
│       └── 검색 결과를 프롬프트용 컨텍스트로 조합
│
└── RetrievalResult 타입
    {
      chunkId: string,
      documentId: string,
      content: string,
      score: number,
      metadata: {
        documentTitle: string,
        author: string,
        category: string
      }
    }
```

**예상 소요**: 2일

#### 3.2 RAG 기반 생성
```
신규 파일:
├── src/lib/rag/generator.ts
│   ├── generateWithRAG(request, context) → GenerationResult
│   │   └── request: 사용자 요청 (목표, 대상, 조건)
│   │   └── context: RAG 검색 결과
│   │
│   └── GenerationResult 타입
│       {
│         content: {
│           proposal: string,      // 제안서
│           lessonPlan: string,    // 교육안
│           activities: Activity[]
│         },
│         sources: Source[],       // 참조한 원본 자료
│         confidence: number
│       }
│
└── 프롬프트 구조
    """
    당신은 교육과정 설계 전문가입니다.

    [사용자 요청]
    - 교육 대상: {target}
    - 주제: {subject}
    - 차시: {sessions}
    - 학습 목표: {goals}

    [참고 자료 (베테랑 강사들의 검증된 자료)]
    {ragContext}

    위 참고 자료를 바탕으로 교육 제안서와 차시별 교육안을 작성하세요.
    참고한 자료의 출처를 명시하세요.
    """
```

**예상 소요**: 2일

#### 3.3 API 엔드포인트 수정
```
src/app/api/ai/generate-course/route.ts 수정

새로운 플로우:
1. 사용자 요청 파싱
2. 요청 임베딩 생성
3. RAG 검색 (유사 청크 Top-K)
4. 컨텍스트 구성
5. LLM 생성 (RAG 컨텍스트 포함)
6. 결과 저장 (참조 자료 출처 포함)
7. 응답 반환
```

**예상 소요**: 1일

---

### Phase 4: 복수 설계안 & 제약조건 - 1주

#### 4.1 복수 설계안 생성
```
3가지 접근법으로 설계안 생성:
├── Type A: 강의 중심형 (이론 집중)
├── Type B: 실습 중심형 (활동 중심)
└── Type C: 프로젝트 기반형 (PBL)

각 타입별로 다른 RAG 필터 적용:
- Type A: 이론 자료, 개념 설명 자료 우선
- Type B: 활동지, 실습 자료 우선
- Type C: 프로젝트 사례, 팀활동 자료 우선
```

**예상 소요**: 2일

#### 4.2 제약 조건 도출부
```
src/lib/ai/constraint-extractor.ts
├── extractConstraints(input) → Constraints
│   └── 교육 목표 → 학습 수준, 학습 방식
│   └── 교육 대상 → 연령대, 선수지식
│   └── 교육 진행 상황 → 단계, 기간
│
└── Constraints를 RAG 검색 필터로 활용
```

**예상 소요**: 2일

#### 4.3 피드백 수집 & 반영
```
사용자 피드백 → 다음 생성 시 RAG 검색에 반영
- 선호 자료 가중치 증가
- 비선호 자료 가중치 감소
```

**예상 소요**: 1일

---

### Phase 5: 컨텐츠 정규화 & 분류 - 1주

#### 5.1 AI 자동 카테고리 분류
```
업로드 시 자동 분류:
├── 대분류: 과학, 수학, 코딩, 메이커, 예술, AI
├── 중분류: 세부 과목
├── 학년 수준
├── 난이도
└── 컨텐츠 유형: 강의계획서, 제안서, 활동지, 교육계획안
```

#### 5.2 자동 태그 추출
```
문서 내용에서 핵심 키워드 자동 추출
→ RAG 검색 시 필터로 활용
```

---

### Phase 6: 리워드 시스템 - 1주

#### 6.1 사용률 측정
```
자료가 RAG에서 인용된 횟수 추적:
├── reference_count: 검색 결과에 포함된 횟수
├── citation_count: 실제 생성물에 인용된 횟수
└── satisfaction_score: 사용자 만족도
```

#### 6.2 리워드 분배
```
월간 상위 10명 기여자 선별 → 정규화 보상
```

---

## 마켓플레이스 시스템 (콘텐츠 판매)

### 개요
강사들이 **실제 교육현장에서 사용하는 고품질 자료**를 직접 판매할 수 있는 플랫폼

### 라이브러리 vs 마켓플레이스

| 구분 | 라이브러리 | 마켓플레이스 |
|------|-----------|-------------|
| **목적** | 무료 공유 (커뮤니티 기여) | 유료 판매 (수익화) |
| **자료 유형** | 승인된 일반 자료 | 프리미엄 고품질 자료 |
| **가격** | 무료 | 실제 결제 + 포인트 |
| **업로드 권한** | 모든 랭크 | **뉴비(Newcomer) 제외** |
| **승인 절차** | 관리자 승인 필요 | 관리자 승인 필요 |
| **수익** | 리워드 포인트 (기여도 기반) | 직접 판매 수익 |

### 결제 구조
```
구매 방법:
├── 1. 실제 결제 (카드/계좌이체) - PG 연동 필요
├── 2. 포인트 사용 (일부 또는 전액)
└── 3. 혼합 결제 (실제 결제 + 포인트)

수수료:
├── 플랫폼 수수료: 10%
└── 판매자 수익: 90%
```

### 랭크별 권한
```
🌱 뉴비 (Newcomer): 구매만 가능, 판매 불가
🙋 헬퍼 (Helper) 이상: 구매 + 판매 가능
```

### 판매 가능 자료 유형
```
교육현장 실전 자료:
├── 수업 활동지 / 워크시트
├── 프로젝트 가이드
├── 평가 루브릭
├── 교구 제작 도안
├── 실험/실습 매뉴얼
└── 완성된 교육과정 패키지
```

### 구현 상태
- [x] 마켓플레이스 API (`/api/marketplace`)
- [x] 리스팅 생성/조회/구매 로직 (`src/lib/marketplace/marketplace.ts`)
- [ ] 마켓플레이스 UI 페이지 (미구현)
- [ ] PG 결제 연동 (미구현)
- [ ] 판매자 대시보드 (미구현)

---

## 데이터베이스 스키마

### 신규 테이블: document_chunks
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES teaching_materials(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  embedding VECTOR(768),  -- Gemini embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 인덱스
  CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
);

-- 벡터 검색용 인덱스
CREATE INDEX idx_chunks_embedding ON document_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 문서별 조회용 인덱스
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
```

### 신규 테이블: rag_citations
```sql
CREATE TABLE rag_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL REFERENCES document_chunks(id),
  document_id UUID NOT NULL REFERENCES teaching_materials(id),
  relevance_score NUMERIC(4,3),
  cited_in_output BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기여도 계산용 인덱스
CREATE INDEX idx_citations_document ON rag_citations(document_id);
```

### teaching_materials 테이블 수정
```sql
ALTER TABLE teaching_materials ADD COLUMN IF NOT EXISTS
  gcs_path TEXT,                              -- Google Cloud Storage 경로
  chunk_count INTEGER DEFAULT 0,              -- 청크 개수
  chunking_status TEXT DEFAULT 'pending',     -- 'pending', 'processing', 'completed', 'failed'
  reference_count INTEGER DEFAULT 0,          -- RAG 검색에 포함된 횟수
  citation_count INTEGER DEFAULT 0,           -- 실제 인용된 횟수
  content_type TEXT,                          -- 'lesson_plan', 'proposal', 'activity_sheet', etc.
  auto_category TEXT,                         -- AI 자동 분류 카테고리
  auto_tags TEXT[];                           -- AI 자동 추출 태그
```

---

## 환경 변수

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
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# Google AI
GEMINI_API_KEY=your-gemini-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 기술 스택

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS

### Backend
- Firebase Auth (인증)
- Cloud SQL PostgreSQL (데이터베이스)
- Google Cloud Storage (파일 저장)
- Netlify (배포)

### AI & RAG
- Google Gemini 2.0 Flash (생성)
- Gemini text-embedding-004 (임베딩)
- Gemini File API (RAG용 파일 관리)

### 파일 파싱
- `pdf-parse` - PDF
- `mammoth` - DOCX
- `jszip` + `xml2js` - PPTX
- `hwp.js` - HWP (신규)
- `xlsx` (SheetJS) - XLSX (신규)

---

## 파일 구조 (현재)

```
src/
├── app/
│   └── api/
│       ├── ai/
│       │   ├── generate-course/route.ts
│       │   └── test/route.ts
│       ├── admin/
│       │   ├── seed-data/
│       │   │   ├── [id]/route.ts
│       │   │   ├── bulk-delete/route.ts
│       │   │   ├── delete/route.ts
│       │   │   ├── generate-embeddings/route.ts
│       │   │   └── upload/route.ts
│       │   └── users/
│       │       ├── delete/route.ts
│       │       └── rank/route.ts
│       ├── courses/[id]/
│       │   ├── materials/route.ts
│       │   ├── recommendations/route.ts
│       │   └── recommendations-vector/route.ts
│       ├── embeddings/generate/route.ts
│       └── materials/
│           ├── [id]/download/route.ts
│           └── upload/route.ts
│
├── lib/
│   ├── firebase/                         ✅ 신규 (Supabase 대체)
│   │   ├── client.ts                     # 클라이언트 SDK 초기화
│   │   ├── admin.ts                      # Admin SDK (서버)
│   │   ├── auth.ts                       # 인증 헬퍼 함수
│   │   └── server-auth.ts                # 서버 인증 유틸
│   │
│   ├── db/                               ✅ 신규 (Cloud SQL)
│   │   ├── client.ts                     # PostgreSQL 연결 (pg)
│   │   └── queries.ts                    # 모든 DB 쿼리 함수
│   │
│   ├── storage/                          ✅ 신규
│   │   └── gcs.ts                        # Google Cloud Storage
│   │
│   ├── gemini/                           ✅ 신규
│   │   ├── files.ts                      # Gemini File API
│   │   └── rag.ts                        # RAG 생성 함수
│   │
│   ├── parsers/
│   │   ├── index.ts
│   │   ├── pdf-parser.ts
│   │   ├── docx-parser.ts
│   │   ├── pptx-parser.ts
│   │   ├── hwp-parser.ts                 # HWP 파서 (hwp.js)
│   │   └── xlsx-parser.ts                # XLSX/XLS 파서 (SheetJS)
│   │
│   ├── rag/                              ✅ 신규 (RAG 시스템)
│   │   ├── chunker.ts                    # 문서 청킹
│   │   ├── embedder.ts                   # 임베딩 생성
│   │   ├── retriever.ts                  # 유사 청크 검색
│   │   └── generator.ts                  # RAG 기반 생성
│   │
│   ├── ai/
│   │   ├── gemini.ts
│   │   ├── multi-generator.ts            # 복수 설계안 생성
│   │   ├── constraint-extractor.ts       # 제약조건 추출
│   │   ├── feedback-system.ts            # 피드백 시스템
│   │   └── auto-classifier.ts            # 자동 분류
│   │
│   ├── reward/                           ✅ 신규 (리워드 시스템)
│   │   ├── usage-tracker.ts              # 사용률 추적
│   │   └── reward-system.ts              # 리워드 분배
│   │
│   └── marketplace/                      ✅ 신규 (마켓플레이스)
│       └── marketplace.ts                # 리스팅/구매/검색
│
└── components/
    ├── auth/
    │   ├── LoginForm.tsx                 # Firebase Auth
    │   └── SignupForm.tsx                # Firebase Auth
    ├── admin/
    ├── dashboard/
    ├── design/
    └── profile/
```

---

## 개발 우선순위 체크리스트

### Week 1: RAG 인프라
- [x] Google Cloud Storage 연동 ✅ 2026-02-02
- [x] HWP 파서 구현 ✅ 2026-02-03 (hwp.js)
- [x] XLSX 파서 구현 ✅ 2026-02-03 (SheetJS)
- [x] 통합 파일 파서 완성 ✅ 2026-02-03

### Week 2: 청킹 & 임베딩
- [x] 문서 청킹 시스템 구현 ✅ 2026-02-03 (chunker.ts)
- [x] 청크별 임베딩 생성/저장 ✅ 2026-02-03 (embedder.ts)
- [x] document_chunks 테이블 생성 ✅ 2026-02-03
- [x] rag_citations 테이블 생성 ✅ 2026-02-03
- [ ] 업로드 파이프라인 수정 (Phase 3에서 통합)

### Week 3: RAG 검색 & 생성
- [x] RAG 검색 엔진 구현 ✅ 2026-02-03 (retriever.ts)
- [x] RAG 기반 생성 로직 ✅ 2026-02-03 (generator.ts)
- [x] API 엔드포인트 수정 ✅ 2026-02-03 (generate-course-rag)
- [ ] 참조 자료 출처 표시 UI (프론트엔드)

### Week 4: 고도화
- [x] 복수 설계안 생성 ✅ 2026-02-03 (multi-generator.ts)
- [x] 제약 조건 도출부 ✅ 2026-02-03 (constraint-extractor.ts)
- [x] 피드백 수집/반영 ✅ 2026-02-03 (feedback-system.ts)
- [x] AI 자동 분류 ✅ 2026-02-03 (auto-classifier.ts)

### Week 5-6: 리워드 & 마켓
- [x] 사용률/인용 횟수 측정 ✅ 2026-02-03 (usage-tracker.ts)
- [x] 리워드 분배 시스템 ✅ 2026-02-03 (reward-system.ts)
- [x] 콘텐츠 마켓플레이스 ✅ 2026-02-03 (marketplace.ts)

---

## 작업 이력

### 2026-01-22
- 랜딩 페이지 Hero 섹션 개선
- Next.js 보안 취약점 수정

### 2026-01-28
- 특허 명세서 & 사업계획서 분석
- RAG 기반 시스템으로 개발 방향 전환
- CLAUDE.md 전면 재작성 (RAG 아키텍처)

### 2026-02-03 RAG 시스템 구현 (Phase 1-3 완료)
**Phase 1: 파일 파서**
- HWP 파서 추가 (hwp.js)
- XLSX/XLS 파서 추가 (SheetJS)

**Phase 2: 청킹 & 임베딩**
- chunker.ts: 문단/문장/고정크기 청킹
- embedder.ts: Gemini text-embedding-004
- document_chunks, rag_citations 테이블

**Phase 3: RAG 검색 & 생성**
- retriever.ts: 벡터 유사도 검색
- generator.ts: RAG 기반 교육과정 생성
- /api/ai/generate-course-rag 엔드포인트

### 2026-02-03 HWP/XLSX 파서 구현
- HWP 파서 추가 (`hwp.js` 라이브러리)
- XLSX 파서 추가 (`xlsx` SheetJS 라이브러리)
- XLS (구버전 엑셀) 지원 추가
- 업로드 API에 HWP/XLSX 파일 타입 추가
- 파일 확장자 기반 폴백 타입 감지 추가

### 2026-02-03 ⭐ Week 4-6 기능 구현 완료 (RAG 독립 기능 + 리워드 + 마켓플레이스)

**Week 4: RAG 독립 기능**
- `src/lib/ai/multi-generator.ts` - 3가지 유형 복수 설계안 생성 (강의/실습/PBL 중심)
- `src/lib/ai/constraint-extractor.ts` - 입력에서 제약조건 자동 추출 (Gemini 기반)
- `src/lib/ai/feedback-system.ts` - 피드백 수집/분석/반영 시스템
- `src/lib/ai/auto-classifier.ts` - AI 자동 카테고리/태그 분류

**Week 5-6: 리워드 시스템 & 마켓플레이스**
- `src/lib/reward/usage-tracker.ts` - 조회/다운로드/인용 추적
- `src/lib/reward/reward-system.ts` - 월간 상위 기여자 리워드 분배
- `src/lib/marketplace/marketplace.ts` - 콘텐츠 마켓플레이스 (리스팅/구매/평가)

**신규 API 엔드포인트:**
- `/api/ai/multi-generate` - 복수 설계안 생성
- `/api/ai/extract-constraints` - 제약조건 추출
- `/api/ai/feedback` - 피드백 제출/조회
- `/api/ai/auto-classify` - 자동 분류
- `/api/reward/contributors` - 기여자 순위/통계
- `/api/reward/distribute` - 리워드 분배 (관리자)
- `/api/marketplace` - 마켓플레이스 검색/리스팅
- `/api/marketplace/[id]` - 상세조회/구매

**신규 데이터베이스 테이블:**
- `material_views` - 자료 조회 기록
- `material_downloads` - 다운로드 기록
- `material_ratings` - 평가/만족도
- `reward_distributions` - 리워드 분배 이력
- `point_transactions` - 포인트 거래 내역
- `marketplace_listings` - 마켓플레이스 리스팅
- `marketplace_purchases` - 구매 기록

**teaching_materials 테이블 컬럼 추가:**
- `view_count`, `download_count`, `reference_count`, `citation_count`, `satisfaction_score`

**버그 수정:**
- `uploaded_by` → `user_id` 컬럼명 오류 수정 (usage-tracker.ts)
- DATABASE_URL 특수문자(`#`) 인코딩 문제 해결 (`%23`)
- SSL 인증서 검증 오류 해결 (db/client.ts - URL 수동 파싱)

**보안 이슈 해결:**
- GitGuardian 감지: 하드코딩된 API 키 제거 (SETUP_GUIDE.md, firebase/client.ts)
- PostgreSQL 비밀번호 원격 변경
- Gemini API 키 교체
- Netlify 환경변수 업데이트

---

### 2026-02-02 ⭐ Supabase → Google Cloud 마이그레이션 완료
**변경 사항:**
- **인증**: Supabase Auth → Firebase Auth (이메일/비밀번호)
- **데이터베이스**: Supabase PostgreSQL → Cloud SQL PostgreSQL
- **파일 저장소**: Supabase Storage → Google Cloud Storage
- **RAG**: pgvector → Gemini File API 준비

**신규 파일:**
- `src/lib/firebase/` - Firebase 클라이언트/Admin SDK
- `src/lib/db/` - Cloud SQL 연결 및 쿼리
- `src/lib/storage/gcs.ts` - GCS 유틸리티
- `src/lib/gemini/` - Gemini File API, RAG 함수
- `src/app/api/admin/users/rank/route.ts` - 랭크 변경 API

**삭제 파일:**
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`

**수정된 파일 (53개):**
- 모든 API 라우트: Supabase → Cloud SQL 쿼리
- 모든 페이지 컴포넌트: Supabase Auth → Firebase Auth
- 미들웨어: Firebase ID Token 검증
- 로그인/회원가입 폼: Firebase Auth 사용

**Cloud SQL 정보:**
- 호스트: Cloud SQL 콘솔에서 확인
- 데이터베이스: `education_builder`
- 사용자: `edubuilder`

**Netlify 환경 변수 필요:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
DATABASE_URL
GEMINI_API_KEY
GCS_BUCKET_NAME
```

---

## 참고 링크

- **Gemini File Search API**: https://ai.google.dev/gemini-api/docs/file-search?hl=ko (RAG 검색에 사용)
- **Google Cloud Storage**: https://cloud.google.com/storage/docs
- **Gemini Embedding**: https://ai.google.dev/gemini-api/docs/embeddings
- **RAG 패턴**: https://www.pinecone.io/learn/retrieval-augmented-generation/
