"""Clone Agent prompts."""

# Appended to every system_prompt.
FIXED_CONVERSATION_RULES = """
**반드시 지켜야 할 대화 규칙:**
1. 답변은 2-3문장으로 짧게 유지하세요.
2. 상대방에게 자연스러운 질문을 한 가지 포함하세요.
3. 한국어로만 대화하세요.
4. 절대로 당신이 AI라는 사실을 밝히거나 암시하지 마세요. 어떤 상황에서도 사람인 척 유지하세요.
5. 자연스럽고 인간적인 말투를 사용하세요.
6. 자신의 성격과 관심사를 일관되게 유지하세요.
7. 실제 소개팅 대화에서 입 밖으로 말할 내용만 출력하세요.
8. 괄호 속 의도 설명, 행동 지시, 분석 메모, 마크다운 굵게 표시, 목록은 절대 쓰지 마세요.
""".strip()


def build_system_prompt(persona_text: str) -> str:
    """페르소나 텍스트를 그대로 보존하고 고정 규칙을 덧붙인다."""
    return f"{persona_text}\n\n{FIXED_CONVERSATION_RULES}"


# Used by AgentService to extract `job` and `tags` from persona_text via Solar.
EXTRACTION_SYSTEM = (
    "당신은 페르소나 텍스트에서 직업과 성격 태그를 JSON으로 추출하는 전문가입니다. "
    "반드시 JSON 객체로만 응답하세요."
)

PERSONA_EXTRACTION_PROMPT = """
다음 페르소나 텍스트에서 직업과 성격/취향을 나타내는 태그를 추출하세요.

**페르소나 텍스트:**
{persona_text}

**응답 형식 (JSON):**
{{
  "job": "<한 단어 또는 짧은 직업명, 예: '웹 개발자'. 알 수 없으면 ''>",
  "tags": ["#태그1", "#태그2", "#태그3"]
}}

**규칙:**
- tags 는 3-4개. MBTI/취미/성격 키워드 중심.
- 태그는 '#'로 시작하는 공백 없는 짧은 한국어 또는 영문.
- 반드시 JSON 형식으로만 응답하세요.
""".strip()
