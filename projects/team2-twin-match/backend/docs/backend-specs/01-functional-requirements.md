# 기능 요구사항 명세서 (Functional Requirements Specification)

**프로젝트**: Multi-Agent Dating Platform
**버전**: 1.0.0
**작성일**: 2026-05-07
**대상**: 백엔드 개발팀

---

## 1. 프로젝트 개요

### 1.1 프로젝트 정의
LLM 페르소나 복제 기술과 Multi-Agent System을 활용한 AI 시뮬레이션 기반 소개팅 플랫폼

### 1.2 Multi-Agent System 구조
본 플랫폼은 3종류의 Agent로 구성된 Multi-Agent System입니다:

1. **Clone Agent (복제 에이전트)**
   - 사용자의 페르소나를 복제한 AI 아바타
   - 다른 Clone Agent와 대화 진행
   - 사용자가 직접 생성

2. **Matchmaker Agent (주선자 에이전트)**
   - 대화 분석 및 케미 평가 전담
   - 시스템에서 자동 생성 (1개)
   - 객관적인 제3자 관점에서 분석

### 1.3 핵심 목표
- 사용자의 페르소나를 복제한 Clone Agent 생성
- Clone Agent 간 자동 대화 시뮬레이션 (20턴)
- Matchmaker Agent를 통한 대화 케미 분석 및 매칭 점수 제공
- 로컬 환경에서 실행 가능한 MVP 데모 개발

### 1.4 기술 스택
- **백엔드**: FastAPI (Python 3.11+)
- **데이터베이스**: SQLite
- **AI API**: Upstage Solar LLM (`solar-pro2`, OpenAI 호환 API)
- **배포**: Docker Compose
- **환경**: 로컬 개발 및 데모

---

## 2. 핵심 기능 목록

| 기능 ID | 기능명 | 우선순위 | 담당 모듈 |
|---------|--------|----------|-----------|
| FR-001 | Agent 생성 | 필수 | Agent Service |
| FR-002 | Agent 조회 | 필수 | Agent Service |
| FR-003 | Agent 매칭 | 필수 | Conversation Service |
| FR-004 | 대화 시뮬레이션 | 필수 | Conversation Service |
| FR-005 | 케미 분석 | 필수 | Chemistry Service |
| FR-006 | 작업 상태 조회 | 필수 | Job Service |
| FR-007 | 헬스체크 | 필수 | System |

---

## 3. 기능 상세 명세

### FR-001: Clone Agent 생성

**목적**: 사용자의 페르소나 텍스트를 기반으로 Clone Agent 생성

**참고**: Matchmaker Agent는 시스템 시작 시 자동 생성되며, 사용자는 Clone Agent만 생성 가능

**입력**:
- `name` (string, required): Agent 이름 또는 닉네임
- `age` (integer, required): 나이 (18-80)
- `gender` (string, required): 성별 ("F", "M", "X")
- `persona_text` (string, required): 사용자 페르소나 텍스트
  - 최소 길이: 50자
  - 최대 길이: 5000자
  - 포함 권장 정보: 성격, 취미, 가치관, 대화 스타일

**처리 로직**:
1. 입력 검증
   - 텍스트 길이 확인 (50자 미만 시 에러)
   - 공백 문자만 있는지 확인
   - 특수문자 과다 사용 여부 확인 (선택적)

2. 텍스트 정규화
   - 앞뒤 공백 제거 (strip)
   - 연속된 공백을 단일 공백으로 변환
   - 유니코드 정규화 (NFC)

3. System Prompt 및 메타데이터 생성
   - 템플릿 기반 프롬프트 생성
   - 페르소나 텍스트 삽입
   - 행동 규칙 포함 (2-3문장 답변, 질문 포함, AI임을 밝히지 말 것)
   - LLM을 활용하여 페르소나 텍스트에서 `job`(직업) 및 `tags`(성격 키워드 3-4개) 추출

4. Clone Agent 저장
   - UUID 생성
   - agent_type = "clone" 설정
   - DB에 저장 (persona_text, system_prompt, agent_type, created_at)
   - Agent 객체 반환

**출력**:
- `id` (UUID): Agent 고유 ID
- `agent_type` (string): "clone"
- `name` (string): 이름
- `age` (integer): 나이
- `gender` (string): 성별
- `job` (string): 추출된 직업
- `tags` (array of strings): 추출된 성격 태그
- `persona_text` (string): 입력받은 페르소나 텍스트
- `system_prompt` (string): 생성된 시스템 프롬프트
- `created_at` (datetime): 생성 시간 (ISO 8601 형식)

**에러 케이스**:
- 400: 페르소나 텍스트가 50자 미만
- 400: 페르소나 텍스트가 비어있거나 공백만 포함
- 500: DB 저장 실패
- 500: System Prompt 생성 실패

**비즈니스 규칙**:
- 한 사용자가 여러 Agent를 생성할 수 있음 (MVP에서는 사용자 인증 없음)
- Agent는 삭제 불가 (MVP 범위)
- Agent는 수정 불가 (MVP 범위)

---

### FR-002: Agent 조회

**목적**: 생성된 Agent 정보 조회

**2-1. 단일 Agent 조회**

**입력**:
- `agent_id` (UUID, path parameter): 조회할 Agent ID

**처리 로직**:
1. agent_id로 DB 조회
2. 존재 여부 확인
3. Agent 객체 반환

**출력**:
- Agent 전체 정보 (id, name, age, gender, persona_text, system_prompt, created_at)

**에러 케이스**:
- 404: Agent ID가 존재하지 않음
- 400: agent_id 형식이 UUID가 아님

**2-2. Agent 목록 조회**

**입력**: 없음 (MVP에서는 페이지네이션 없음)

**처리 로직**:
1. DB에서 모든 Agent 조회
2. 생성 시간 역순 정렬 (최신순)
3. 리스트 반환

**출력**:
- Agent 배열 (각 Agent의 전체 정보 포함)

**에러 케이스**:
- 500: DB 조회 실패

**비즈니스 규칙**:
- MVP에서는 모든 Agent를 반환 (페이지네이션 없음)
- 향후 대량 데이터 시 페이지네이션 고려 필요

---

### FR-003: Agent 매칭 전략 (Matching Strategy)

**목적**: 특정 Agent를 다른 Agent와 연결하여 대화 세션(Conversation)을 생성합니다. 시스템은 확장성을 고려하여 두 가지 매칭 전략을 정의하며, MVP에서는 **전략 A**를 기본으로 사용합니다.

#### [전략 A] 즉시 랜덤 매칭 (Instant Pool Matching) - MVP 기본 채택
DB에 이미 생성되어 있는 에이전트 풀(Pool)에서 즉시 한 명을 무작위로 선택하는 방식입니다.

- **비즈니스 규칙**:
  - 대기 시간 없이 즉시 대화 세션이 생성됨.
  - 시드 데이터(가상 에이전트)를 활용하여 1인 테스트 환경 제공 가능.
- **처리 로직**:
  1. 요청 Agent 존재 여부 확인
  2. DB에서 본인을 제외한 모든 `agent_type='clone'` 목록 조회
  3. 목록 중 1명을 무작위 선택 (`random.choice`)
  4. 선택된 상대와 즉시 `Conversation` 생성 및 세션 ID 반환

#### [전략 B] 대기큐 기반 매칭 (Queue-based Matching) - 선택적 고도화 옵션 (Optional)
매칭 파트너가 나타날 때까지 대기열(Queue)에서 기다린 후, 조건이 맞는 상대와 연결하는 방식입니다.

- **비즈니스 규칙**:
  - 실제 유저 간의 동시 접속 및 실시간 매칭을 지향함.
  - 일정 시간 매칭이 안 되면 전략 A(AI 매칭)로 전환하는 Fallback 로직 권장.
- **처리 로직 (폴링 방식)**:
  1. **진입**: 유저가 매칭 요청 시 `matching_queue` 테이블에 `agent_id` 등록 (status='waiting').
  2. **매칭 워커**: 백그라운드 워커가 주기적으로 대기열을 확인하여 2명씩 페어링.
  3. **상태 확인**: 클라이언트는 `GET /api/queue/status`를 폴링하며 자신의 상태가 'matched'가 될 때까지 대기.

**입력 (전략 A/B 공통)**:
- `agent_id` (UUID): 매칭을 요청하는 Agent ID

**출력**:
- `id` (UUID): Conversation ID
- `agent_a_id` (UUID): 요청 Agent ID
- `agent_b_id` (UUID): 매칭된 Agent ID
- `status` (string): "pending"
- `created_at` (datetime): 생성 시간

**에러 케이스**:
- 404: 요청한 agent_id가 존재하지 않음
- 400: 매칭 가능한 다른 Agent가 없음 (전략 A 시 DB 풀이 비어있음)
- 500: DB 저장 실패

---


### FR-004: 대화 시뮬레이션

**목적**: 매칭된 두 Agent가 20턴 동안 자동으로 대화 진행

**입력**:
- `conversation_id` (UUID, path parameter): 대화 세션 ID

**처리 로직**:
1. **사전 검증**
   - conversation_id 존재 여부 확인
   - 대화 상태 확인 (이미 완료된 대화는 재실행 불가)
   - 두 Agent 정보 로드 (agent_a, agent_b)

2. **비동기 Job 생성**
   - Job UUID 생성
   - Job 상태 DB에 저장 (status = "pending")
   - 즉시 job_id 반환 (클라이언트는 폴링으로 상태 확인)

3. **백그라운드 대화 루프 실행**
   - 각 Agent의 대화 컨텍스트 초기화 (messages = [])
   - 20턴 반복 (총 40개 메시지):
     ```python
     for turn in range(1, 21):
         # Agent A 발화
         message_a = call_solar_api(agent_a.system_prompt, context_a)
         save_message(conversation_id, agent_a.id, message_a, turn*2-1)
         context_a.append({"role": "assistant", "content": message_a})
         context_b.append({"role": "user", "content": message_a})

         # Agent B 발화
         message_b = call_solar_api(agent_b.system_prompt, context_b)
         save_message(conversation_id, agent_b.id, message_b, turn*2)
         context_b.append({"role": "assistant", "content": message_b})
         context_a.append({"role": "user", "content": message_b})
     ```

4. **대화 완료 처리**
   - Conversation 상태 업데이트 (status = "completed", completed_at = 현재시간)
   - Job 상태 업데이트 (status = "completed", result = conversation data)

5. **에러 발생 시 처리**
   - Solar LLM API 호출 실패 시: 1회 재시도
   - 재시도 실패 시: Job 상태를 "failed"로 업데이트, error 메시지 저장
   - Conversation 상태를 "failed"로 업데이트

**출력 (즉시 반환)**:
- `job_id` (UUID): 비동기 작업 ID
- `message` (string): "대화가 시작되었습니다"

**에러 케이스**:
- 404: conversation_id가 존재하지 않음
- 400: 대화가 이미 완료됨 (status = "completed")
- 500: Job 생성 실패

**비즈니스 규칙**:
- 대화는 비동기로 실행됨 (약 20-40초 소요)
- Agent A가 항상 먼저 시작
- 각 턴은 Solar LLM API 호출로 생성
- 대화 중 에러 발생 시 해당 시점까지의 메시지는 보존됨
- turn_number는 1부터 시작 (Agent A: 1, 3, 5..., Agent B: 2, 4, 6...)

---

### FR-005: 케미 분석 (Matchmaker Agent)

**목적**: Matchmaker Agent가 완료된 대화를 분석하여 두 Clone Agent의 케미 점수 산출

**Multi-Agent 구조**:
- Clone Agent A와 B가 대화한 내역을 Matchmaker Agent에게 전달
- Matchmaker Agent가 제3자 관점에서 객관적으로 분석

**입력**:
- `conversation_id` (UUID, path parameter): 대화 세션 ID

**처리 로직**:
1. **사전 검증**
   - conversation_id 존재 여부 확인
   - 대화 완료 여부 확인 (status = "completed")
   - 메시지 존재 여부 확인

2. **이미 분석된 경우**
   - chemistry_analyses 테이블에서 해당 conversation_id 조회
   - 존재하면 저장된 결과 반환 (중복 분석 방지)

3. **Matchmaker Agent 조회**
   - DB에서 agent_type = "matchmaker" 조회
   - Matchmaker Agent의 system_prompt 로드

4. **대화 로그 포맷팅**
   - 모든 메시지를 시간순 정렬
   - "Agent A: 안녕하세요!\nAgent B: 반가워요!" 형식으로 변환
   - Matchmaker Agent에게 전달할 프롬프트 구성

5. **Matchmaker Agent 실행 (Solar LLM API 호출)**
   - Matchmaker Agent의 system_prompt 사용
   - 대화 로그와 분석 요청을 user message로 전달
   - JSON 형식 응답 강제 (response_format: json_object)
   - `solar-pro2` 모델 사용

6. **결과 저장**
   - chemistry_analyses 테이블에 저장
   - conversation_id 및 matchmaker_agent_id 연결

7. **결과 반환**
   - 분석 결과 JSON 반환

**출력**:
- `score` (integer): 케미 점수 (0-100)
- `oneliner` (string): 관계 한 줄 평 (결과 상단 노출용)
- `summary` (string): 상세 요약
- `good_points` (array of strings): 잘 맞는 점 목록
- `concerns` (array of strings): 우려되는 점 목록
- `metrics` (object): 상세 지표 (티키타카, 공통 화제, 분위기, 거리감 점수)
- `final_comment` (string): 주선자 AI의 최종 코멘트

**에러 케이스**:
- 404: conversation_id가 존재하지 않음
- 400: 대화가 완료되지 않음 (status != "completed")
- 400: 대화 메시지가 없음
- 500: Matchmaker Agent를 찾을 수 없음
- 500: Solar LLM API 호출 실패
- 500: 결과 파싱 실패 (JSON 형식 오류)
- 500: DB 저장 실패

**비즈니스 규칙**:
- 동일 대화에 대한 분석은 1회만 수행 (캐싱)
- 분석은 동기 처리 (약 3-5초 소요)
- 메시지가 10개 미만일 경우에도 분석 가능 (대화 중단된 경우)
- Matchmaker Agent는 시스템 시작 시 자동 생성되어야 함

---

### FR-006: 작업 상태 조회 (폴링)

**목적**: 비동기 작업(대화 시뮬레이션)의 진행 상태 조회

**입력**:
- `job_id` (UUID, path parameter): 작업 ID

**처리 로직**:
1. job_id로 jobs 테이블 조회
2. 존재 여부 확인
3. Job 상태 정보 반환

**출력**:
- `job_id` (UUID): 작업 ID
- `status` (string): 작업 상태
  - "pending": 대기 중
  - "processing": 진행 중
  - "completed": 완료
  - "failed": 실패
- `result` (object|null): 완료 시 대화 결과, 아니면 null
  - `conversation`: Conversation 객체
  - `messages`: Message 배열
  - `chemistry`: ChemistryAnalysis 객체 (분석 완료 시)
- `error` (string|null): 실패 시 에러 메시지, 아니면 null

**에러 케이스**:
- 404: job_id가 존재하지 않음

**비즈니스 규칙**:
- 클라이언트는 3초 간격으로 폴링 권장
- status가 "completed" 또는 "failed"가 될 때까지 반복
- Job 데이터는 24시간 후 자동 삭제 (선택적, MVP에서는 삭제 안 함)

---

### FR-007: 헬스체크

**목적**: 서버 및 데이터베이스 상태 확인

**입력**: 없음

**처리 로직**:
1. 서버 실행 상태 확인
2. SQLite DB 연결 테스트 (간단한 SELECT 쿼리)
3. 상태 정보 반환

**출력**:
- `status` (string): "healthy" | "unhealthy"
- `database` (string): "connected" | "disconnected"
- `timestamp` (datetime): 확인 시간

**에러 케이스**:
- 500: DB 연결 실패 (status = "unhealthy", database = "disconnected")

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

### 4.1 성능
- API 응답 시간: 일반 API는 500ms 이하 (대화 시뮬레이션 제외)
- 대화 시뮬레이션: 20-40초 이내 완료
- 케미 분석: 5초 이내 완료
- 동시 사용자: MVP에서는 10명 미만 (로컬 환경)

### 4.2 보안
- API 키 노출 방지 (환경 변수 사용)
- CORS 설정 (프론트엔드 도메인만 허용)
- SQL Injection 방지 (ORM 사용)
- MVP에서는 인증/권한 없음

### 4.3 안정성
- Solar LLM API 호출 실패 시 1회 재시도
- 에러 발생 시 명확한 에러 메시지 반환
- 데이터베이스 트랜잭션 관리

### 4.4 확장성
- 모듈화된 구조로 향후 기능 추가 용이
- 데이터베이스 마이그레이션 고려
- 향후 PostgreSQL 전환 가능하도록 ORM 사용

### 4.5 유지보수성
- 코드 문서화 (Docstrings)
- 일관된 코드 스타일 (Black, isort)
- 환경 변수 분리 (.env)
- 로깅 (에러 추적용)

---

## 5. MVP 범위 명확화

### 5.1 포함 (Must Have)
✅ Agent 생성, 조회<br>
✅ Agent 랜덤 매칭<br>
✅ 20턴 자동 대화 시뮬레이션<br>
✅ 케미 분석 (점수, 요약, 장단점)<br>
✅ 비동기 작업 상태 조회 (폴링)<br>
✅ 헬스체크<br>
✅ SQLite 데이터베이스<br>
✅ Docker Compose 환경<br>

### 5.2 제외 (Out of Scope)
❌ 사용자 인증/로그인<br>
❌ Agent 수정/삭제 기능<br>
❌ 페이지네이션<br>
❌ 실시간 대화 스트리밍 (WebSocket)<br>
❌ 부적절 콘텐츠 필터링<br>
❌ 매칭 알고리즘 (케미 기반 매칭)<br>
❌ 프로덕션 배포 (AWS, GCP 등)<br>
❌ 모니터링 및 로그 수집 시스템<br>
❌ 성능 최적화 (캐싱, 인덱싱 등)<br>

### 5.3 향후 고려사항
- 사용자 인증 시스템
- Agent 편집 기능
- 대화 히스토리 관리
- 매칭 알고리즘 개선 (유사도 기반)
- PostgreSQL 전환
- 클라우드 배포

---

## 6. 데이터 흐름 (Data Flow)

### 6.1 Multi-Agent 전체 흐름
```
[시스템 시작]
0. Matchmaker Agent 자동 생성 (최초 1회)
   → agent_type = "matchmaker"
   → 케미 분석 전담

[사용자 플로우]
1. [POST /api/agents]
   → Clone Agent 생성 (name, age, gender, persona_text 입력)
   → agent_id 반환

2. [POST /api/conversations/match]
   → Clone Agent 간 랜덤 매칭
   → conversation_id 반환

3. [POST /api/conversations/{id}/start]
   → 두 Clone Agent 간 비동기 대화 시작
   → job_id 반환

4. [GET /api/jobs/{job_id}] (폴링)
   → status 확인
   → "completed"가 될 때까지 3초마다 반복

5. [POST /api/conversations/{id}/analyze]
   → Matchmaker Agent가 대화 분석
   → 점수 및 결과 반환

6. [GET /api/conversations/{id}/result]
   → 전체 대화 내역 + 케미 결과 조회
```

### 6.2 Multi-Agent 상호작용
```
Clone Agent A ←→ Clone Agent B (20턴 대화)
         ↓
    대화 로그
         ↓
  Matchmaker Agent (분석 및 평가)
         ↓
     케미 점수
```

---

## 7. 제약 조건 및 가정

### 7.1 제약 조건
- Upstage Solar LLM API 사용 (`UPSTAGE_API_KEY` 필요, https://console.upstage.ai 에서 발급)
- 로컬 환경에서만 실행 (인터넷 연결 필요)
- SQLite 단일 파일 DB (동시성 제한)
- Python 3.11 이상 필요

### 7.2 가정
- 프론트엔드는 별도 개발 (Next.js)
- 초기 데모용으로 10개 미만의 Agent 사용
- 대화 품질은 Upstage Solar LLM 응답에 의존
- 한국어 중심 서비스

---

## 8. 용어 정의

| 용어 | 정의 |
|------|------|
| Clone Agent | 사용자의 페르소나를 복제한 AI 아바타 (agent_type = "clone") |
| Matchmaker Agent | 대화 분석 및 케미 평가를 담당하는 주선자 AI (agent_type = "matchmaker") |
| Multi-Agent System | Clone Agent들과 Matchmaker Agent로 구성된 시스템 |
| Conversation | 두 Clone Agent 간의 대화 세션 |
| Turn | 대화에서 한 번의 발화 (Clone Agent A 1회 + Clone Agent B 1회 = 1턴) |
| Chemistry | 두 Clone Agent 간의 케미(궁합) |
| Job | 비동기로 실행되는 작업 (대화 시뮬레이션) |
| System Prompt | Agent의 성격과 행동 규칙을 정의하는 프롬프트 |
| Persona Text | 사용자가 입력하는 자기소개 텍스트 |

---

**문서 버전**: 1.0.0
**최종 수정일**: 2026-05-07
**작성자**: 백엔드팀
