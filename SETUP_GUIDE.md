# Google Cloud 설정 가이드

## 현재 완료된 작업

### ✅ GCP 프로젝트
- **프로젝트 ID**: `edu-builder-studio-20260202`
- **계정**: `eid0318@eduinolab.com`

### ✅ 활성화된 API
- Cloud SQL Admin API
- Cloud Storage API
- Firebase API

### ✅ Cloud Storage
- **버킷**: `gs://education-builder-materials`
- **CORS**: 설정 완료

### ✅ Cloud SQL
- **인스턴스**: `edu-builder-db`
- **데이터베이스**: `education_builder`
- **사용자**: `edubuilder`
- **버전**: PostgreSQL 15
- **리전**: asia-northeast3 (서울)
- **네트워크**: 모든 IP 허용 (개발용)

### ✅ Firebase Auth
- 이메일/비밀번호 인증 활성화
- 웹 앱 등록 완료

### ✅ RAG 시스템
- **Gemini File Search** 사용 (Vertex AI Search 대신)
- 별도 설정 불필요, Gemini API 키만 있으면 됨

---

## 환경 변수 체크리스트

`.env.local` 파일:

| 변수 | 상태 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | 필수 | Firebase 콘솔에서 복사 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 필수 | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 필수 | |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY` | ⚠️ ADC 사용 | 로컬: ADC, 배포: 키 필요 |
| `DATABASE_URL` | 필수 | Cloud SQL 연결 문자열 |
| `GCS_PROJECT_ID` | 필수 | |
| `GCS_BUCKET_NAME` | 필수 | |
| `GCS_SERVICE_ACCOUNT_KEY` | ⚠️ ADC 사용 | 로컬: ADC, 배포: 키 필요 |
| `GEMINI_API_KEY` | 필수 | Google AI Studio에서 발급 |

---

## 로컬 개발 시작

### 1. Application Default Credentials 설정

```bash
gcloud auth application-default login
```

브라우저에서 Google 계정으로 로그인

### 2. 환경 변수 설정

`.env.local` 파일 생성 (절대 git에 커밋하지 마세요!):

```
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
GCS_PROJECT_ID=<your-project-id>
GCS_BUCKET_NAME=<your-bucket-name>
GEMINI_API_KEY=<your-gemini-api-key>
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 개발 서버 시작

```bash
npm run dev
```

---

## 스키마 마이그레이션 (최초 1회)

```bash
psql "$DATABASE_URL" -f scripts/migrate-schema.sql
```

또는 gcloud 사용:

```bash
gcloud sql connect edu-builder-db --user=edubuilder --project=edu-builder-studio-20260202
# 접속 후
\i scripts/migrate-schema.sql
```

---

## 배포 (Netlify)

### 환경 변수 설정

Netlify Dashboard → Site settings → Environment variables에서 위 환경 변수들을 설정하세요.

**⚠️ 절대로 API 키나 비밀번호를 코드에 하드코딩하지 마세요!**

### 서비스 계정 키 (필요시)

조직 관리자에게 서비스 계정 키 생성 권한 요청 후:

```bash
gcloud iam service-accounts keys create key.json --iam-account=<service-account-email>
```

생성된 JSON을 한 줄로 변환하여 환경 변수에 추가:
- `FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY`
- `GCS_SERVICE_ACCOUNT_KEY`

---

## 문제 해결

### "Key creation is not allowed" 오류
조직 정책으로 서비스 계정 키 생성 차단됨.
- 로컬: `gcloud auth application-default login` 사용
- 배포: 조직 관리자에게 권한 요청

### Cloud SQL 접속 불가
1. IP 허용 설정 확인: `gcloud sql instances describe edu-builder-db`
2. 비밀번호 확인
3. 방화벽 규칙 확인
