# Design: 사용자 간 메시지 보내기 기능

> Plan 문서: `docs/01-plan/features/user-messaging.plan.md`

---

## 1. 데이터베이스 설계

### 1.1 신규 테이블: `conversations`

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 동일 참가자 쌍 중복 방지 (정렬 저장)
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2),
  -- participant_1 < participant_2 강제 (정렬 일관성)
  CONSTRAINT ordered_participants CHECK (participant_1 < participant_2)
);

CREATE INDEX idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX idx_conversations_p2 ON conversations(participant_2);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);
```

**설계 결정:**
- `participant_1 < participant_2` 제약으로 A→B, B→A 대화가 동일 레코드로 관리
- `last_message_preview`: 대화 목록에서 마지막 메시지 미리보기 표시 (별도 JOIN 불필요)

### 1.2 신규 테이블: `messages`

```sql
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

**제약:**
- `content` 최대 2000자 (API에서 검증)
- `is_read`는 수신자 기준 (발신자 메시지는 항상 읽음 처리)

---

## 2. API 설계

### 2.1 `POST /api/messages/send` — 메시지 전송

**Request:**
```typescript
{
  recipientId: string   // 수신자 Firebase UID
  content: string       // 메시지 내용 (1~2000자)
}
```

**Response (200):**
```typescript
{
  success: true
  message: { id, conversation_id, sender_id, content, created_at }
  conversationId: string
}
```

**로직:**
1. 인증 확인 (`getAuthenticatedUser`)
2. 자기 자신에게 전송 차단
3. 수신자 존재 확인 (`getProfile`)
4. 스팸 제한 확인 (새싹 랭크: 일일 5건)
5. 기존 대화 검색 → 없으면 트랜잭션으로 생성
6. 메시지 INSERT + 대화 `last_message_at`, `last_message_preview` UPDATE

**스팸 제한 쿼리:**
```sql
SELECT COUNT(*) FROM messages
WHERE sender_id = $1
AND created_at >= CURRENT_DATE
```

### 2.2 `GET /api/messages/conversations` — 대화 목록

**Response (200):**
```typescript
{
  success: true
  conversations: [{
    id: string
    partner: {
      id: string
      name: string
      rank: string
      profile_image_url: string | null
    }
    last_message_at: string
    last_message_preview: string
    unread_count: number
  }]
}
```

**쿼리:**
```sql
SELECT
  c.*,
  CASE WHEN c.participant_1 = $1 THEN p2.id ELSE p1.id END as partner_id,
  CASE WHEN c.participant_1 = $1 THEN p2.name ELSE p1.name END as partner_name,
  CASE WHEN c.participant_1 = $1 THEN p2.rank ELSE p1.rank END as partner_rank,
  CASE WHEN c.participant_1 = $1 THEN p2.profile_image_url ELSE p1.profile_image_url END as partner_image,
  (SELECT COUNT(*) FROM messages m
   WHERE m.conversation_id = c.id
   AND m.sender_id != $1
   AND m.is_read = FALSE) as unread_count
FROM conversations c
JOIN profiles p1 ON c.participant_1 = p1.id
JOIN profiles p2 ON c.participant_2 = p2.id
WHERE c.participant_1 = $1 OR c.participant_2 = $1
ORDER BY c.last_message_at DESC
```

### 2.3 `GET /api/messages/conversations/[id]` — 대화 메시지 조회

**Query Params:** `?cursor=<message_id>&limit=30`

**Response (200):**
```typescript
{
  success: true
  messages: [{
    id: string
    sender_id: string
    content: string
    is_read: boolean
    created_at: string
  }]
  partner: { id, name, rank, profile_image_url }
  hasMore: boolean
}
```

**로직:**
1. 인증 확인
2. 대화 참여자 확인 (본인이 participant_1 또는 participant_2인지)
3. 메시지 30개씩 페이지네이션 (커서 기반, 최신순)
4. 진입 시 상대방 메시지 일괄 읽음 처리

**읽음 처리:**
```sql
UPDATE messages SET is_read = TRUE
WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE
```

### 2.4 `GET /api/messages/unread-count` — 안읽은 메시지 수

**Response (200):**
```typescript
{
  success: true
  count: number
}
```

**쿼리:**
```sql
SELECT COUNT(*) FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE (c.participant_1 = $1 OR c.participant_2 = $1)
AND m.sender_id != $1
AND m.is_read = FALSE
```

### 2.5 `GET /api/users/search?q=이름` — 유저 검색

**Query Params:** `?q=<검색어>` (최소 2글자)

**Response (200):**
```typescript
{
  success: true
  users: [{
    id: string
    name: string
    rank: string
    profile_image_url: string | null
  }]
}
```

**쿼리:**
```sql
SELECT id, name, rank, profile_image_url
FROM profiles
WHERE name ILIKE $1 AND id != $2
ORDER BY name
LIMIT 10
```

**보안:**
- 본인 제외
- 이메일/전화번호 등 개인정보 노출 없음
- 최대 10건 반환

---

## 3. UI 컴포넌트 설계

### 3.1 파일 구조

```
src/
├── app/
│   ├── api/
│   │   ├── messages/
│   │   │   ├── send/route.ts
│   │   │   ├── conversations/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── unread-count/route.ts
│   │   └── users/
│   │       └── search/route.ts
│   └── (dashboard)/
│       └── messages/
│           └── page.tsx
├── components/
│   └── messages/
│       ├── SendMessageModal.tsx
│       ├── ConversationList.tsx
│       ├── MessageThread.tsx
│       ├── NewMessageComposer.tsx
│       ├── UserSearchInput.tsx
│       └── UnreadBadge.tsx
└── lib/
    └── db/
        └── messages.ts
```

### 3.2 메시지 페이지 레이아웃 (`/messages/page.tsx`)

```
┌──────────────────────────────────────────────────┐
│ [새 메시지] 버튼                                    │
├──────────────────┬───────────────────────────────┤
│ ConversationList │ MessageThread                  │
│                  │                                │
│ 🟢 김선생님      │ ┌────────────────────────────┐ │
│ "안녕하세요..."   │ │ 상대방 메시지 (좌측 정렬)    │ │
│                  │ └────────────────────────────┘ │
│ 박선생님         │ ┌────────────────────────────┐ │
│ "자료 감사합니다" │ │       내 메시지 (우측 정렬)  │ │
│                  │ └────────────────────────────┘ │
│                  │                                │
│                  │ ┌──────────────────────┐ [전송] │
│                  │ │ 메시지 입력...         │       │
│                  │ └──────────────────────┘       │
├──────────────────┴───────────────────────────────┤
│ (모바일: ConversationList ↔ MessageThread 전환)     │
└──────────────────────────────────────────────────┘
```

**반응형:**
- **데스크톱 (lg+):** 좌측 대화 목록 + 우측 메시지 스레드 (2컬럼)
- **모바일:** 대화 목록 ↔ 메시지 스레드 전환 (1컬럼)

### 3.3 컴포넌트 상세

#### `SendMessageModal`
- **진입점:** 라이브러리 자료 카드의 업로더 이름 클릭
- **Props:** `recipientId: string, recipientName: string, onClose: () => void`
- **UI:** 모달 오버레이 → 수신자 이름(읽기전용) + 메시지 textarea + 전송 버튼
- **전송 후:** 모달 닫기 + 성공 토스트

#### `ConversationList`
- **Props:** `conversations: Conversation[], selectedId: string | null, onSelect: (id) => void`
- **각 아이템:** 상대방 이름 + 랭크 뱃지 + 마지막 메시지 미리보기 + 시간 + 안읽은 수 뱃지
- **빈 상태:** "아직 대화가 없습니다" 메시지

#### `MessageThread`
- **Props:** `conversationId: string, currentUserId: string`
- **메시지 버블:** 내 메시지(우측, 파란색) / 상대 메시지(좌측, 회색)
- **스크롤:** 최신 메시지로 자동 스크롤, 위로 스크롤 시 이전 메시지 로드
- **입력:** 하단 고정 textarea + 전송 버튼 (Enter로 전송, Shift+Enter 줄바꿈)
- **폴링:** 30초마다 새 메시지 확인

#### `NewMessageComposer`
- **진입:** "새 메시지" 버튼 클릭 시 표시
- **UI:** UserSearchInput + 메시지 textarea + 전송 버튼
- **전송 후:** 생성된 대화 스레드로 이동

#### `UserSearchInput`
- **Props:** `onSelect: (user: { id, name, rank }) => void`
- **동작:** 2글자 이상 입력 시 300ms 디바운스 → `/api/users/search` 호출
- **UI:** 입력창 + 드롭다운 리스트 (이름 + 랭크 뱃지)
- **선택:** 클릭 시 `onSelect` 호출, 입력창에 선택된 이름 표시

#### `UnreadBadge`
- **Props:** `count: number`
- **UI:** 빨간 원 + 숫자 (9+ 표시, 0이면 숨김)
- **사용 위치:** DashboardHeader, Sidebar, BottomNav의 메시지 메뉴 옆

---

## 4. 기존 파일 수정 사항

### 4.1 `src/app/(dashboard)/library/page.tsx`

**변경:** Material 인터페이스에 `user_id` 필드 추가 + 업로더 이름을 클릭 가능하게 변경

```tsx
// 현재 (line 211)
<p className="text-sm text-gray-500 truncate">
  {material.user_name || '익명'}
</p>

// 변경 후
<button
  onClick={() => openSendMessageModal(material.user_id, material.user_name)}
  className="text-sm text-cobalt-600 hover:underline truncate"
  title="메시지 보내기"
>
  {material.user_name || '익명'}
</button>
```

**주의:** 마켓플레이스 API 응답에 `user_id` 필드가 포함되어야 함 → API 수정 필요

### 4.2 `src/components/dashboard/Sidebar.tsx`

**변경:** 메시지 메뉴 아이템 추가 (리워드 뒤, 프로필 앞)

```tsx
import { MessageSquare } from 'lucide-react'

// navItems에 추가
{
  href: '/messages',
  label: '메시지',
  icon: MessageSquare,
}
```

### 4.3 `src/components/dashboard/DashboardHeader.tsx`

**변경 1:** 메시지 아이콘 + UnreadBadge 추가 (프로필 버튼 옆)

```tsx
import { MessageSquare } from 'lucide-react'
import { UnreadBadge } from '@/components/messages/UnreadBadge'

// 프로필 버튼 앞에 추가
<button
  onClick={() => router.push('/messages')}
  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
  title="메시지"
>
  <MessageSquare className="w-5 h-5 text-gray-600" />
  <UnreadBadge />
</button>
```

**변경 2:** 모바일 메뉴 navItems에 메시지 추가

### 4.4 `src/components/dashboard/BottomNav.tsx`

**변경:** 메시지 아이콘 추가 (모바일 하단 네비게이션)

```tsx
import { MessageSquare } from 'lucide-react'

// navItems에 추가 (라이브러리 뒤)
{
  href: '/messages',
  label: '메시지',
  icon: MessageSquare,
}
```

### 4.5 마켓플레이스 API 수정

`/api/marketplace` 검색 응답에 `user_id` 필드 포함 필요 (현재 `user_name`만 반환)

---

## 5. DB 쿼리 모듈 설계 (`src/lib/db/messages.ts`)

```typescript
import { query, withTransaction } from './client'

// ===== 타입 정의 =====
export interface Conversation { ... }
export interface Message { ... }
export interface ConversationWithPartner { ... }

// ===== 대화 관련 =====
export async function findConversation(userId1: string, userId2: string): Promise<Conversation | null>
export async function createConversation(userId1: string, userId2: string): Promise<Conversation>
export async function getConversations(userId: string): Promise<ConversationWithPartner[]>

// ===== 메시지 관련 =====
export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<Message>
export async function getMessages(conversationId: string, cursor?: string, limit?: number): Promise<Message[]>
export async function markAsRead(conversationId: string, userId: string): Promise<void>
export async function getUnreadCount(userId: string): Promise<number>

// ===== 스팸 제한 =====
export async function getDailyMessageCount(userId: string): Promise<number>

// ===== 유저 검색 =====
export async function searchUsers(searchQuery: string, excludeUserId: string): Promise<UserSearchResult[]>
```

---

## 6. 구현 순서

```
Step 1: DB 테이블 생성
├── conversations 테이블 + 인덱스
└── messages 테이블 + 인덱스

Step 2: DB 쿼리 모듈
└── src/lib/db/messages.ts (모든 쿼리 함수)

Step 3: API 엔드포인트
├── /api/messages/send (POST)
├── /api/messages/conversations (GET)
├── /api/messages/conversations/[id] (GET)
├── /api/messages/unread-count (GET)
└── /api/users/search (GET)

Step 4: UI 컴포넌트
├── UnreadBadge (가장 독립적)
├── UserSearchInput (독립적)
├── SendMessageModal (라이브러리 연동)
├── ConversationList
├── MessageThread
└── NewMessageComposer

Step 5: 메시지 페이지
└── /messages/page.tsx (ConversationList + MessageThread + NewMessageComposer 통합)

Step 6: 기존 파일 수정
├── Sidebar.tsx (메시지 메뉴)
├── DashboardHeader.tsx (메시지 아이콘 + 뱃지)
├── BottomNav.tsx (모바일 메시지 메뉴)
├── library/page.tsx (업로더 클릭 → 메시지)
└── 마켓플레이스 API (user_id 필드 추가)

Step 7: 빌드 테스트 + 검증
```

---

## 7. 보안 체크리스트

| 항목 | 대응 |
|------|------|
| 인증 | 모든 API에 `getAuthenticatedUser()` 적용 |
| 권한 | 대화 조회 시 참여자 본인 확인 |
| SQL Injection | 파라미터 바인딩 ($1, $2...) 사용 |
| XSS | React 기본 이스케이프 + content 길이 제한 |
| 스팸 | 새싹 랭크 일일 5건 제한 |
| 개인정보 | 유저 검색에서 이름/랭크/이미지만 반환 |
| 에러 메시지 | production에서 제네릭 메시지 반환 |
| 자기 자신 | 본인에게 메시지 전송 차단 |
