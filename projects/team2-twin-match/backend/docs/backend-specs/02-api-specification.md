# API 명세서 (API Specification)

**프로젝트**: Multi-Agent Dating Platform API
**버전**: 1.0.0
**Base URL**: `http://localhost:8000`
**작성일**: 2026-05-07

---

## 1. API 설계 원칙

### 1.1 RESTful 설계
- 리소스 중심 URL 설계
- HTTP 메서드 의미에 맞게 사용 (GET, POST, PUT, DELETE)
- 명사형 복수형 사용 (`/agents`, `/conversations`)

### 1.2 응답 형식
- 모든 응답은 JSON 형식
- Content-Type: `application/json`
- 날짜/시간은 ISO 8601 형식 (예: `2026-05-04T15:21:45.035507Z`)
- UUID는 하이픈 포함 문자열 형식 (예: `550e8400-e29b-41d4-a716-446655440000`)

### 1.3 HTTP 상태 코드
- 200: 성공 (GET, PUT, DELETE)
- 201: 생성 성공 (POST)
- 400: 잘못된 요청 (유효성 검사 실패)
- 404: 리소스 없음
- 500: 서버 내부 오류

### 1.4 에러 응답 형식
모든 에러는 다음 형식을 따름:
```json
{
  "detail": "에러 메시지"
}
```

---

## 2. 공통 요소

### 2.1 Request Headers
```
Content-Type: application/json
```

MVP에서는 인증 헤더 없음 (Authorization 불필요)

### 2.2 Response Headers
```
Content-Type: application/json
```

### 2.3 CORS 설정
- 로컬 프론트엔드 허용: `http://localhost:3000`
- 메서드: GET, POST, PUT, DELETE, OPTIONS
- 헤더: Content-Type, Authorization (향후 사용)

---

## 3. 데이터 모델 (Schemas)

### 3.1 Agent
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_type": "clone",
  "persona_text": "저는 28세 개발자입니다. 주로 웹 개발을 하고 있고...",
  "system_prompt": "당신은 다음 정보를 가진 사람입니다...",
  "created_at": "2026-05-04T15:21:45.035507Z"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string (UUID) | ✅ | Agent 고유 ID |
| agent_type | string | ✅ | Agent 종류 ("clone" 또는 "matchmaker") |
| persona_text | string \| null | ✅ | Clone: 사용자 페르소나 텍스트<br>Matchmaker: null |
| system_prompt | string | ✅ | 생성된 시스템 프롬프트 |
| created_at | string (datetime) | ✅ | 생성 시간 (ISO 8601) |

### 3.2 Conversation
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "agent_a_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_b_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "created_at": "2026-05-04T15:23:32.319984Z",
  "completed_at": "2026-05-04T15:24:00.000000Z"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string (UUID) | ✅ | 대화 세션 ID |
| agent_a_id | string (UUID) | ✅ | Agent A ID |
| agent_b_id | string (UUID) | ✅ | Agent B ID |
| status | string | ✅ | 대화 상태 (pending, processing, completed, failed) |
| created_at | string (datetime) | ✅ | 생성 시간 |
| completed_at | string (datetime) \| null | ✅ | 완료 시간 (완료 전에는 null) |

### 3.3 Message
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "conversation_id": "660e8400-e29b-41d4-a716-446655440001",
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "안녕하세요! 반가워요.",
  "turn_number": 1,
  "created_at": "2026-05-04T15:23:33.000000Z"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string (UUID) | ✅ | 메시지 ID |
| conversation_id | string (UUID) | ✅ | 대화 세션 ID |
| agent_id | string (UUID) | ✅ | 발화한 Agent ID |
| content | string | ✅ | 메시지 내용 |
| turn_number | integer | ✅ | 턴 번호 (1-40) |
| created_at | string (datetime) | ✅ | 생성 시간 |

### 3.4 ChemistryAnalysis
```json
{
  "score": 85,
  "oneliner": "서로의 대화가 매우 자연스럽습니다",
  "summary": "두 분신은 기술적인 주제와 취미 생활에서 높은 공통점을 보였습니다.",
  "good_points": [
    "공통 관심사(등산)를 통한 빠른 유대감 형성",
    "서로의 직업에 대한 높은 이해도"
  ],
  "concerns": [
    "둘 다 내향적인 성향이라 초반 어색함 가능성"
  ],
  "metrics": {
    "티키타카": 92,
    "공통 화제": 84,
    "분위기": 81,
    "거리감": 75
  },
  "final_comment": "충분히 만나볼 가치가 있는 조합입니다."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| score | integer | ✅ | 케미 점수 (0-100) |
| oneliner | string | ✅ | 한 줄 평 (결과 상단 노출) |
| summary | string | ✅ | 관계 요약 (1-2문장) |
| good_points | array[string] | ✅ | 잘 맞는 점 목록 |
| concerns | array[string] | ✅ | 우려되는 점 목록 |
| metrics | object | ✅ | 상세 지표 (티키타카, 공통 화제, 분위기, 거리감) |
| final_comment | string | ✅ | 최종 한마디 |

### 3.5 JobStatus
```json
{
  "job_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "completed",
  "result": {
    "conversation": { /* Conversation 객체 */ },
    "messages": [ /* Message 배열 */ ]
  },
  "error": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| job_id | string (UUID) | ✅ | 작업 ID |
| status | string | ✅ | 작업 상태 (pending, processing, completed, failed) |
| result | object \| null | ✅ | 완료 시 결과, 아니면 null |
| error | string \| null | ✅ | 실패 시 에러 메시지, 아니면 null |

---

## 4. API 엔드포인트

### 4.1 General (시스템)

#### GET `/`
루트 엔드포인트 - API 기본 정보 반환

**Request**
```
GET / HTTP/1.1
Host: localhost:8000
```

**Response (200 OK)**
```json
{
  "message": "Multi-Agent Dating Platform API",
  "status": "running",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/health"
}
```

---

#### GET `/health`
헬스체크 - 서버 및 DB 상태 확인

**Request**
```
GET /health HTTP/1.1
Host: localhost:8000
```

**Response (200 OK)**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-05-04T15:00:00Z"
}
```

**Response (500 Internal Server Error)** - DB 연결 실패
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "timestamp": "2026-05-04T15:00:00Z"
}
```

---

### 4.2 Agents (Agent 관리)

#### POST `/api/agents`
Agent 생성 - 페르소나 텍스트로 Clone Agent 생성

**Request**
```http
POST /api/agents HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "name": "민준",
  "age": 28,
  "gender": "M",
  "persona_text": "저는 28세 개발자입니다. 주로 웹 개발을 하고 있고, 주말에는 등산을 좋아합니다. 조용하고 신중한 성격이지만, 친해지면 유머러스한 면도 있습니다."
}
```

**Request Body Schema**
| 필드 | 타입 | 필수 | 제약조건 |
|------|------|------|----------|
| name | string | ✅ | Agent 이름 (닉네임) |
| age | integer | ✅ | Agent 나이 (18-80) |
| gender | string | ✅ | Agent 성별 ("F", "M", "X") |
| persona_text | string | ✅ | 최소 50자, 최대 5000자 |

**Response (201 Created)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_type": "clone",
  "name": "민준",
  "age": 28,
  "gender": "M",
  "job": "웹 개발자",
  "tags": ["#INTP", "#필름카메라", "#등산"],
  "persona_text": "저는 28세 개발자입니다...",
  "system_prompt": "당신은 다음 정보를 가진 사람입니다...",
  "created_at": "2026-05-04T15:21:45.035507Z"
}
```

**Response (400 Bad Request)** - 텍스트 길이 부족
```json
{
  "detail": "최소 50자 이상 입력해주세요."
}
```

**Response (400 Bad Request)** - 빈 텍스트
```json
{
  "detail": "페르소나 텍스트가 비어있습니다."
}
```

---

#### GET `/api/agents/{agent_id}`
단일 Agent 조회

**Request**
```http
GET /api/agents/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: localhost:8000
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| agent_id | string (UUID) | ✅ | Agent ID |

**Response (200 OK)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_type": "clone",
  "persona_text": "저는 28세 개발자입니다...",
  "system_prompt": "당신은 다음 정보를 가진 사람입니다...",
  "created_at": "2026-05-04T15:21:45.035507Z"
}
```

**Response (404 Not Found)**
```json
{
  "detail": "Agent를 찾을 수 없습니다"
}
```

**Response (400 Bad Request)** - UUID 형식 오류
```json
{
  "detail": "올바른 UUID 형식이 아닙니다"
}
```

---

#### GET `/api/agents`
Agent 목록 조회

**Request**
```http
GET /api/agents HTTP/1.1
Host: localhost:8000
```

**Response (200 OK)**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_type": "clone",
    "persona_text": "저는 28세 개발자입니다...",
    "system_prompt": "당신은 다음 정보를 가진 사람입니다...",
    "created_at": "2026-05-04T15:21:45.035507Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "agent_type": "clone",
    "persona_text": "저는 25세 디자이너입니다...",
    "system_prompt": "당신은 다음 정보를 가진 사람입니다...",
    "created_at": "2026-05-04T15:20:30.123456Z"
  }
]
```

**Response (200 OK)** - 빈 목록
```json
[]
```

---

### 4.3 Conversations (대화 관리)

#### POST `/api/conversations/match`
Agent 매칭 - 랜덤으로 다른 Agent와 매칭

**Request**
```http
POST /api/conversations/match HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Body Schema**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| agent_id | string (UUID) | ✅ | 매칭을 요청하는 Agent ID |

**비고**:
- 기본 동작: DB 에이전트 풀에서 즉시 랜덤 매칭 (**전략 A**)
- 설정 시: 대기큐에 등록 후 대기 (**전략 B**)
- 전략 B 사용 시 응답은 201 Created와 함께 `queue_id`를 반환할 수 있음 (또는 동일하게 `conversation_id` 필드에 null 반환)

**Response (201 Created)**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "agent_a_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_b_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "created_at": "2026-05-04T15:23:32.319984Z",
  "completed_at": null
}
```

**Response (404 Not Found)** - Agent 없음
```json
{
  "detail": "Agent를 찾을 수 없습니다"
}
```

**Response (400 Bad Request)** - 매칭 불가
```json
{
  "detail": "매칭할 다른 Agent가 없습니다"
}
```

---

#### POST `/api/conversations/{conversation_id}/start`
대화 시작 - 백그라운드에서 20턴 대화 실행

**Request**
```http
POST /api/conversations/660e8400-e29b-41d4-a716-446655440001/start HTTP/1.1
Host: localhost:8000
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| conversation_id | string (UUID) | ✅ | 대화 세션 ID |

**Response (200 OK)**
```json
{
  "job_id": "880e8400-e29b-41d4-a716-446655440003",
  "message": "대화가 시작되었습니다"
}
```

**Response (404 Not Found)**
```json
{
  "detail": "대화 세션을 찾을 수 없습니다"
}
```

**Response (400 Bad Request)** - 이미 완료된 대화
```json
{
  "detail": "이미 완료된 대화입니다"
}
```

**비고**:
- 대화는 비동기로 실행됨 (약 20-40초 소요)
- 반환된 `job_id`로 `/api/jobs/{job_id}` 폴링하여 완료 확인
- 권장 폴링 간격: 3초

---

#### GET `/api/conversations/{conversation_id}/result`
대화 결과 조회 - 전체 대화 내역 및 케미 분석 결과

**Request**
```http
GET /api/conversations/660e8400-e29b-41d4-a716-446655440001/result HTTP/1.1
Host: localhost:8000
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| conversation_id | string (UUID) | ✅ | 대화 세션 ID |

**Response (200 OK)** - 완료된 대화
```json
{
  "conversation": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "agent_a": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "민준",
      "age": 28,
      "job": "개발자",
      "tags": ["#INTP", "#등산"]
    },
    "agent_b": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "서연",
      "age": 26,
      "job": "마케터",
      "tags": ["#ENFP", "#카페"]
    },
    "status": "completed",
    "created_at": "2026-05-04T15:23:32.319984Z",
    "completed_at": "2026-05-04T15:24:00.000000Z"
  },
  "messages": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "conversation_id": "660e8400-e29b-41d4-a716-446655440001",
      "agent_id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "안녕하세요! 반가워요.",
      "turn_number": 1,
      "created_at": "2026-05-04T15:23:33.000000Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "conversation_id": "660e8400-e29b-41d4-a716-446655440001",
      "agent_id": "550e8400-e29b-41d4-a716-446655440001",
      "content": "안녕하세요! 저도 반갑습니다.",
      "turn_number": 2,
      "created_at": "2026-05-04T15:23:35.000000Z"
    }
    // ... 총 40개 메시지
  ],
  "chemistry": {
    "score": 85,
    "oneliner": "서로의 대화가 매우 자연스럽습니다",
    "summary": "두 분신은 기술적인 주제와 취미 생활에서 높은 공통점을 보였습니다.",
    "good_points": ["공통 관심사(등산) 발견", "직업적 유대감"],
    "concerns": ["내향적 성향"],
    "metrics": {
      "티키타카": 92,
      "공통 화제": 84,
      "분위기": 81
    },
    "final_comment": "충분히 만나볼 가치가 있는 조합입니다."
  }
}
```

**Response (200 OK)** - 분석 전
```json
{
  "conversation": { /* ... */ },
  "messages": [ /* ... */ ],
  "chemistry": null
}
```

**Response (404 Not Found)**
```json
{
  "detail": "대화 결과를 찾을 수 없습니다"
}
```

---

#### POST `/api/conversations/{conversation_id}/analyze`
케미 분석 - 대화 내역 기반 케미 점수 산출

**Request**
```http
POST /api/conversations/660e8400-e29b-41d4-a716-446655440001/analyze HTTP/1.1
Host: localhost:8000
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| conversation_id | string (UUID) | ✅ | 대화 세션 ID |

**Response (200 OK)**
```json
{
  "score": 85,
  "oneliner": "서로의 대화가 매우 자연스럽습니다",
  "summary": "두 분신은 기술적인 주제와 취미 생활에서 높은 공통점을 보였습니다.",
  "good_points": [
    "공통 관심사(등산)를 통한 빠른 유대감 형성",
    "서로의 직업에 대한 높은 이해도"
  ],
  "concerns": [
    "둘 다 내향적인 성향이라 초반 어색함 가능성"
  ],
  "metrics": {
    "티키타카": 92,
    "공통 화제": 84,
    "분위기": 81
  },
  "final_comment": "충분히 만나볼 가치가 있는 조합입니다."
}
```

**Response (404 Not Found)**
```json
{
  "detail": "대화 세션을 찾을 수 없습니다"
}
```

**Response (400 Bad Request)** - 대화 미완료
```json
{
  "detail": "대화가 완료되지 않았습니다"
}
```

**Response (400 Bad Request)** - 메시지 없음
```json
{
  "detail": "대화 내역을 찾을 수 없습니다"
}
```

**Response (500 Internal Server Error)** - Solar LLM API 실패
```json
{
  "detail": "케미 분석 중 오류가 발생했습니다"
}
```

**비고**:
- 동일 대화에 대해 재분석 시 캐시된 결과 반환 (중복 분석 방지)
- 동기 처리 (약 3-5초 소요)

---

### 4.4 Jobs (비동기 작업)

#### GET `/api/jobs/{job_id}`
작업 상태 조회 - 폴링용

**Request**
```http
GET /api/jobs/880e8400-e29b-41d4-a716-446655440003 HTTP/1.1
Host: localhost:8000
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| job_id | string (UUID) | ✅ | 작업 ID |

**Response (200 OK)** - 대기 중
```json
{
  "job_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "pending",
  "result": null,
  "error": null
}
```

**Response (200 OK)** - 진행 중
```json
{
  "job_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "processing",
  "result": null,
  "error": null
}
```

**Response (200 OK)** - 완료
```json
{
  "job_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "completed",
  "result": {
    "conversation": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "agent_a_id": "550e8400-e29b-41d4-a716-446655440000",
      "agent_b_id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "completed",
      "created_at": "2026-05-04T15:23:32.319984Z",
      "completed_at": "2026-05-04T15:24:00.000000Z"
    },
    "messages": [
      /* Message 배열 (40개) */
    ]
  },
  "error": null
}
```

**Response (200 OK)** - 실패
```json
{
  "job_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "failed",
  "result": null,
  "error": "Solar LLM API 호출 실패: Rate limit exceeded"
}
```

**Response (404 Not Found)**
```json
{
  "detail": "작업을 찾을 수 없습니다"
}
```

**폴링 가이드**:
```python
import time
import requests

job_id = "your-job-id"
base_url = "http://localhost:8000"

while True:
    response = requests.get(f"{base_url}/api/jobs/{job_id}")
    data = response.json()

    if data["status"] in ["completed", "failed"]:
        print("작업 완료:", data)
        break

    print(f"진행 중... 상태: {data['status']}")
    time.sleep(3)  # 3초 대기
```

---

### 4.5 Matching Queue [Optional]
대기큐 기반 매칭(전략 B) 사용 시 대기 상태 조회

#### GET `/api/queue/{queue_id}/status`
매칭 대기 상태 조회

**Request**
```http
GET /api/queue/990e8400-e29b-41d4-a716-446655440004/status HTTP/1.1
Host: localhost:8000
```

**Response (200 OK)**
```json
{
  "queue_id": "990e8400-e29b-41d4-a716-446655440004",
  "status": "waiting",
  "conversation_id": null
}
```

**Response (200 OK)** - 매칭 완료
```json
{
  "queue_id": "990e8400-e29b-41d4-a716-446655440004",
  "status": "matched",
  "conversation_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

---

## 5. 에러 코드 정리

### 5.1 클라이언트 에러 (4xx)

| 상태 코드 | 에러 메시지 | 발생 상황 |
|-----------|-------------|-----------|
| 400 | 최소 50자 이상 입력해주세요. | persona_text < 50자 |
| 400 | 페르소나 텍스트가 비어있습니다. | persona_text가 빈 문자열 또는 공백만 |
| 400 | 매칭할 다른 Agent가 없습니다 | 전체 Agent가 1개뿐 |
| 400 | 이미 완료된 대화입니다 | 대화 재시작 시도 |
| 400 | 대화가 완료되지 않았습니다 | 미완료 대화 분석 시도 |
| 400 | 대화 내역을 찾을 수 없습니다 | 메시지가 없는 대화 분석 시도 |
| 400 | 올바른 UUID 형식이 아닙니다 | UUID 형식 오류 |
| 404 | Agent를 찾을 수 없습니다 | 존재하지 않는 agent_id |
| 404 | 대화 세션을 찾을 수 없습니다 | 존재하지 않는 conversation_id |
| 404 | 작업을 찾을 수 없습니다 | 존재하지 않는 job_id |

### 5.2 서버 에러 (5xx)

| 상태 코드 | 에러 메시지 | 발생 상황 |
|-----------|-------------|-----------|
| 500 | 데이터베이스 오류가 발생했습니다 | DB 연결/쿼리 실패 |
| 500 | System Prompt 생성 실패 | 프롬프트 생성 오류 |
| 500 | Solar LLM API 호출 실패 | Upstage Solar LLM API 에러 |
| 500 | 케미 분석 중 오류가 발생했습니다 | 분석 처리 오류 |
| 500 | 작업 생성 실패 | Job 생성 오류 |

---

## 6. 통합 사용 예시

### 시나리오: Agent 생성 → 매칭 → 대화 → 분석

```bash
# 1. Agent A 생성
curl -X POST http://localhost:8000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "persona_text": "저는 28세 개발자입니다. 웹 개발을 하고, 등산을 좋아합니다."
  }'
# Response: {"id": "agent-a-uuid", ...}

# 2. Agent B 생성
curl -X POST http://localhost:8000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "persona_text": "저는 25세 디자이너입니다. UI/UX 디자인을 하고, 사진 찍기를 좋아합니다."
  }'
# Response: {"id": "agent-b-uuid", ...}

# 3. 매칭
curl -X POST http://localhost:8000/api/conversations/match \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent-a-uuid"
  }'
# Response: {"id": "conversation-uuid", "status": "pending", ...}

# 4. 대화 시작
curl -X POST http://localhost:8000/api/conversations/conversation-uuid/start
# Response: {"job_id": "job-uuid", "message": "대화가 시작되었습니다"}

# 5. 작업 상태 조회 (폴링)
curl http://localhost:8000/api/jobs/job-uuid
# Response: {"status": "processing", ...} → 3초 후 재시도
# Response: {"status": "completed", "result": {...}}

# 6. 케미 분석
curl -X POST http://localhost:8000/api/conversations/conversation-uuid/analyze
# Response: {"score": 78, "summary": "...", ...}

# 7. 전체 결과 조회
curl http://localhost:8000/api/conversations/conversation-uuid/result
# Response: {"conversation": {...}, "messages": [...], "chemistry": {...}}
```

---

## 7. API 문서 자동 생성

FastAPI는 자동으로 API 문서를 생성합니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

개발 중에는 Swagger UI를 활용하여 API 테스트를 진행하세요.

---

**문서 버전**: 1.0.0
**최종 수정일**: 2026-05-07
**작성자**: 백엔드팀
