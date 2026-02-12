# PDCA Report: user-messaging (1:1 DM)

## Overview

| Item | Value |
|------|-------|
| Feature | 사용자 간 메시지 보내기 (1:1 DM) |
| PDCA Cycle | Plan -> Design -> Do -> Check -> Act -> Report |
| Final Match Rate | **97%** |
| Start Date | 2026-02-12 |
| Completion Date | 2026-02-12 |

---

## 1. Plan Phase

**문서:** `docs/01-plan/features/user-messaging.plan.md`

### 핵심 요구사항
- 라이브러리에서 자료 업로더에게 바로 메시지 보내기
- 유저 검색으로 강사를 찾아 1:1 메시지 보내기
- 대화 스레드 관리, 읽음 표시, 안읽은 메시지 뱃지

### MVP 기능 (F-01 ~ F-08)
| ID | 기능 | 구현 상태 |
|----|------|:---------:|
| F-01 | 메시지 전송 | DONE |
| F-02 | 메시지 수신함 | DONE |
| F-03 | 대화 스레드 | DONE |
| F-04 | 읽음 표시 | DONE |
| F-05 | 라이브러리 연동 | DONE |
| F-06 | 안읽은 메시지 뱃지 | DONE |
| F-07 | 유저 검색 | DONE |
| F-08 | 새 메시지 작성 | DONE |

---

## 2. Design Phase

**문서:** `docs/02-design/features/user-messaging.design.md`

### 설계 결정 사항
- **DB**: `conversations` + `messages` 2개 테이블, participant ordering 제약
- **API**: REST 5개 + 유저 검색 1개 엔드포인트
- **UI**: 6개 컴포넌트 + 1개 페이지
- **실시간**: 폴링 기반 (WebSocket 인프라 없어 MVP로 적합)
- **보안**: 인증, 참여자 확인, SQL 파라미터 바인딩, 스팸 제한

---

## 3. Do Phase (Implementation)

### 신규 파일 (14개)

| 파일 | 역할 |
|------|------|
| `src/lib/db/messages.ts` | DB 쿼리 모듈 (10개 함수) |
| `src/app/api/messages/send/route.ts` | 메시지 전송 API |
| `src/app/api/messages/conversations/route.ts` | 대화 목록 API |
| `src/app/api/messages/conversations/[id]/route.ts` | 메시지 스레드 API |
| `src/app/api/messages/unread-count/route.ts` | 안읽은 수 API |
| `src/app/api/users/search/route.ts` | 유저 검색 API |
| `src/components/messages/UnreadBadge.tsx` | 안읽은 뱃지 (자체 폴링) |
| `src/components/messages/UserSearchInput.tsx` | 유저 검색 (디바운스) |
| `src/components/messages/SendMessageModal.tsx` | 메시지 전송 모달 |
| `src/components/messages/ConversationList.tsx` | 대화 목록 |
| `src/components/messages/MessageThread.tsx` | 채팅 스레드 |
| `src/components/messages/NewMessageComposer.tsx` | 새 메시지 작성 |
| `src/app/(dashboard)/messages/page.tsx` | 메시지 페이지 |

### 기존 파일 수정 (4개)

| 파일 | 변경 내용 |
|------|----------|
| `Sidebar.tsx` | 메시지 메뉴 + UnreadBadge 추가 |
| `DashboardHeader.tsx` | 메시지 아이콘 + UnreadBadge + 모바일 메뉴 |
| `BottomNav.tsx` | 메시지 메뉴 + UnreadBadge 추가 |
| `library/page.tsx` | 업로더 클릭 -> SendMessageModal 연동 |

---

## 4. Check Phase (Gap Analysis)

**문서:** `docs/03-analysis/user-messaging.analysis.md`

### 분석 결과
- **초기 Match Rate:** 95%
- **발견된 갭:** 8개 (1 MEDIUM, 7 LOW)

### 주요 갭

| ID | 심각도 | 설명 | 조치 |
|----|:------:|------|------|
| GAP-6 | MEDIUM | Sidebar/BottomNav에 UnreadBadge 누락 | **수정 완료** |
| GAP-8 | LOW | SendMessageModal 성공 피드백 없음 | **수정 완료** |
| GAP-1 | LOW | UnreadBadge self-fetching 패턴 | 수용 (실용적) |
| GAP-2 | LOW | 폴링 간격 불일치 (30s vs 60s) | 수용 (컨텍스트별 적절) |
| GAP-3~5 | LOW | 컴포넌트 token prop 차이 | 수용 (인증 필요) |
| GAP-7 | LOW | 마켓플레이스 API user_id | 이미 동작 |

---

## 5. Act Phase (Gap Fixes)

### 수정 내역

**1. Sidebar.tsx - UnreadBadge 추가**
```tsx
import { UnreadBadge } from '@/components/messages/UnreadBadge'
// 메시지 메뉴 항목에 <UnreadBadge /> 렌더링
```

**2. BottomNav.tsx - UnreadBadge 추가**
```tsx
import { UnreadBadge } from '@/components/messages/UnreadBadge'
// 메시지 아이콘 옆에 <UnreadBadge /> 렌더링
```

**3. SendMessageModal.tsx - 성공 피드백**
```tsx
const [success, setSuccess] = useState(false)
// 전송 성공 시 green 배너 표시 + 1초 후 모달 닫기
```

### 최종 Match Rate: **97%**

---

## 6. 성공 기준 달성 현황

| 기준 | 달성 |
|------|:----:|
| 메시지 페이지에서 유저 검색 -> 메시지 전송 가능 | PASS |
| 라이브러리에서 업로더 클릭 -> 메시지 전송 가능 | PASS |
| 메시지 페이지에서 대화 목록/상세 조회 가능 | PASS |
| 안읽은 메시지 뱃지 표시 (Header, Sidebar, BottomNav) | PASS |
| 유저 검색 자동완성 동작 (2글자 이상) | PASS |
| 새싹 랭크 일일 전송 제한 동작 | PASS |
| 빌드 에러 없음 | PASS |
| 기존 기능 영향 없음 | PASS |

---

## 7. 배포 전 필수 작업

### DB 테이블 생성 (Cloud SQL)

```sql
-- 1. conversations 테이블
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2),
  CONSTRAINT ordered_participants CHECK (participant_1 < participant_2)
);

CREATE INDEX idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX idx_conversations_p2 ON conversations(participant_2);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);

-- 2. messages 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;
```

---

## 8. 향후 개선 사항

| 우선순위 | 기능 | 설명 |
|:--------:|------|------|
| Phase 2 | 메시지 내 검색 | 대화 내용 풀텍스트 검색 |
| Phase 2 | 자료 링크 첨부 | 메시지에 교육 자료 링크 포함 |
| Phase 2 | 사용자 차단 | 스팸 사용자 차단 기능 |
| Phase 3 | 실시간 메시징 | WebSocket/SSE 도입 |
| Phase 3 | 타이핑 표시 | 상대방 입력 중 표시 |
| Phase 3 | 온라인 상태 | 사용자 접속 상태 표시 |
