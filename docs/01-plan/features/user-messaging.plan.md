# Plan: 사용자 간 메시지 보내기 기능

## 1. 개요

### 배경
Education Builder Studio에서 강사들 간 소통 수단이 없다. 라이브러리에서 자료를 보고 업로더에게 문의하거나, 특정 강사를 찾아 협업을 제안하고 싶어도 방법이 없는 상태이다.

### 목적
- **유저 검색**으로 강사를 찾아 1:1 메시지를 보낼 수 있는 기능 구현
- **라이브러리 연동**으로 자료 업로더에게 바로 메시지를 보낼 수 있는 기능 구현
- 강사 간 교류와 협업을 촉진하여 교육 생태계 활성화

### 핵심 사용자 시나리오

**시나리오 A: 라이브러리에서 메시지 보내기**
```
1. 강사 A가 라이브러리에서 "아두이노 기초 교육안" 자료를 발견
2. 업로더 이름 "김선생님"을 클릭 → 메시지 보내기 옵션 표시
3. 메시지 작성 모달에서 내용 입력 후 전송
4. 김선생님이 메시지 페이지에서 확인 및 답장
```

**시나리오 B: 유저 검색으로 메시지 보내기**
```
1. 강사 A가 메시지 페이지에서 "새 메시지" 클릭
2. 유저 검색창에 "김선생" 입력 → 검색 결과에서 선택
3. 메시지 작성 후 전송
4. 기존 대화가 있으면 해당 스레드에 추가, 없으면 새 스레드 생성
```

---

## 2. 기능 요구사항

### 필수 기능 (MVP)

| ID | 기능 | 설명 |
|----|------|------|
| F-01 | 메시지 전송 | 특정 사용자에게 텍스트 메시지 전송 |
| F-02 | 메시지 수신함 | 받은 메시지 목록 조회 (대화 스레드별) |
| F-03 | 대화 스레드 | 동일 상대와의 메시지를 스레드로 그룹핑 |
| F-04 | 읽음 표시 | 메시지 읽음/안읽음 상태 관리 |
| F-05 | 라이브러리 연동 | 자료 카드에서 업로더에게 바로 메시지 보내기 |
| F-06 | 안읽은 메시지 뱃지 | 헤더에 안읽은 메시지 개수 표시 |
| F-07 | 유저 검색 | 이름으로 사용자 검색 → 선택 → 메시지 보내기 |
| F-08 | 새 메시지 작성 | 메시지 페이지에서 "새 메시지" → 유저 검색 → 전송 |

### 선택 기능 (향후)

| ID | 기능 | 설명 |
|----|------|------|
| F-09 | 알림 (이메일) | 새 메시지 수신 시 이메일 알림 |
| F-10 | 자료 첨부 링크 | 메시지에 자료 링크 첨부 |
| F-11 | 차단 기능 | 특정 사용자 메시지 차단 |
| F-12 | 실시간 알림 | WebSocket 기반 실시간 메시지 수신 |

---

## 3. 기술 분석

### 현재 인프라 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| DB (Cloud SQL PostgreSQL) | 사용 가능 | `pg` 라이브러리, 트랜잭션 지원 |
| 인증 (Firebase Auth) | 사용 가능 | `getAuthenticatedUser()` 패턴 |
| 실시간 통신 | 미구축 | WebSocket/SSE 없음 |
| 알림 시스템 | 미구축 | 이메일/푸시 없음 |

### 기술 접근 방식

**MVP: 폴링 기반 (Polling)**
- 현재 WebSocket 인프라가 없으므로 REST API + 주기적 폴링으로 시작
- 메시지 페이지 진입 시 30초 간격 폴링으로 새 메시지 확인
- 헤더 뱃지는 60초 간격으로 안읽은 메시지 수 폴링

**향후: 실시간 업그레이드**
- Socket.io 또는 Firebase Realtime Database로 실시간 전환 가능

### 데이터베이스 설계 (초안)

```sql
-- 대화 스레드
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 TEXT NOT NULL REFERENCES profiles(id),
  participant_2 TEXT NOT NULL REFERENCES profiles(id),
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2)
);

-- 메시지
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(sender_id, is_read) WHERE is_read = FALSE;
```

### API 엔드포인트 설계 (초안)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/messages/send` | 메시지 전송 (대화 자동 생성) |
| GET | `/api/messages/conversations` | 내 대화 목록 조회 |
| GET | `/api/messages/conversations/[id]` | 대화 메시지 상세 조회 |
| PATCH | `/api/messages/[id]/read` | 메시지 읽음 처리 |
| GET | `/api/messages/unread-count` | 안읽은 메시지 수 |
| GET | `/api/users/search?q=이름` | 유저 이름 검색 (자동완성용) |

### UI 컴포넌트 설계 (초안)

| 컴포넌트 | 위치 | 설명 |
|----------|------|------|
| `SendMessageModal` | 라이브러리 자료 카드 | 메시지 작성 모달 |
| `MessagesPage` | `/dashboard/messages` | 메시지 메인 페이지 |
| `ConversationList` | 메시지 페이지 좌측 | 대화 스레드 목록 |
| `MessageThread` | 메시지 페이지 우측 | 대화 상세 (채팅 형태) |
| `NewMessageComposer` | 메시지 페이지 | 새 메시지 작성 (유저 검색 + 입력) |
| `UserSearchInput` | NewMessageComposer 내부 | 유저 이름 검색 자동완성 드롭다운 |
| `UnreadBadge` | 대시보드 헤더/사이드바 | 안읽은 메시지 수 뱃지 |

---

## 4. 영향 범위

### 수정 필요 파일 (예상)

**신규 파일:**
- `src/lib/db/messages.ts` — 메시지 DB 쿼리 함수
- `src/app/api/messages/send/route.ts` — 메시지 전송 API
- `src/app/api/messages/conversations/route.ts` — 대화 목록 API
- `src/app/api/messages/conversations/[id]/route.ts` — 대화 상세 API
- `src/app/api/messages/[id]/read/route.ts` — 읽음 처리 API
- `src/app/api/messages/unread-count/route.ts` — 안읽은 수 API
- `src/app/api/users/search/route.ts` — 유저 검색 API
- `src/app/(dashboard)/dashboard/messages/page.tsx` — 메시지 페이지
- `src/components/messages/SendMessageModal.tsx` — 전송 모달
- `src/components/messages/ConversationList.tsx` — 대화 목록
- `src/components/messages/MessageThread.tsx` — 메시지 스레드
- `src/components/messages/NewMessageComposer.tsx` — 새 메시지 (유저 검색 포함)
- `src/components/messages/UserSearchInput.tsx` — 유저 검색 자동완성
- `src/components/messages/UnreadBadge.tsx` — 안읽은 뱃지

**기존 파일 수정:**
- `src/app/(dashboard)/library/page.tsx` — 업로더 이름 클릭 → 메시지 보내기 연동
- `src/components/dashboard/DashboardSidebar.tsx` — 메시지 메뉴 + 뱃지 추가
- `src/components/dashboard/DashboardHeader.tsx` — 헤더에 메시지 아이콘 + 뱃지

### 랭크 제한

| 랭크 | 메시지 전송 | 비고 |
|------|------------|------|
| 새싹 (Newcomer) | 제한적 (하루 5건) | 스팸 방지 |
| 초급 (Junior) 이상 | 무제한 | - |

---

## 5. 리스크 및 고려사항

| 리스크 | 대응 방안 |
|--------|----------|
| 스팸/악용 | 새싹 랭크 일일 전송 제한, 향후 차단 기능 추가 |
| DB 부하 | 메시지 조회 시 페이지네이션, 인덱스 최적화 |
| 개인정보 | 이메일 노출 없이 플랫폼 내 메시지만 제공 |
| XSS 공격 | 메시지 content HTML 이스케이프 (React 기본 제공) |
| 실시간성 부족 | MVP는 폴링, 향후 WebSocket 업그레이드 |

---

## 6. 구현 우선순위

```
Phase 1 (MVP): 핵심 메시징
├── DB 테이블 생성 (conversations, messages)
├── 메시지 전송/조회 API
├── 유저 검색 API
├── 메시지 페이지 UI (대화 목록 + 스레드 + 새 메시지)
├── 유저 검색 → 메시지 보내기
├── 라이브러리 → 메시지 보내기 연동
└── 안읽은 메시지 뱃지

Phase 2 (개선): 사용성 향상
├── 메시지 내 검색
├── 자료 링크 첨부
├── 사용자 차단
└── 이메일 알림

Phase 3 (고도화): 실시간
├── WebSocket/SSE 실시간 메시지
├── 타이핑 표시
└── 온라인 상태 표시
```

---

## 7. 예상 작업량

| 영역 | 작업 | 예상 규모 |
|------|------|----------|
| DB | 테이블 2개 + 인덱스 | 소 |
| API | 엔드포인트 6개 (메시지 5 + 유저 검색 1) | 중 |
| UI | 페이지 1개 + 컴포넌트 7개 | 대 |
| 기존 수정 | 라이브러리 + 사이드바 + 헤더 | 중 |

---

## 8. 성공 기준

- [ ] 메시지 페이지에서 유저 검색 → 메시지 전송 가능
- [ ] 라이브러리에서 업로더 클릭 → 메시지 전송 가능
- [ ] 메시지 페이지에서 대화 목록/상세 조회 가능
- [ ] 안읽은 메시지 뱃지 표시
- [ ] 유저 검색 자동완성 동작 (이름 2글자 이상 입력 시)
- [ ] 새싹 랭크 일일 전송 제한 동작
- [ ] 빌드 에러 없음
- [ ] 기존 기능 영향 없음
