"""User-side prompt for the Matchmaker analysis call."""

from typing import Iterable

CHEMISTRY_ANALYSIS_PROMPT = """
다음은 두 사람(Agent A와 Agent B)의 소개팅 대화 내역입니다.
이 대화를 분석하여 두 사람의 케미(궁합)를 평가해 주세요.

**대화 내역:**
{conversation_transcript}

**응답 형식 (JSON):**
{{
  "score": <0-100 정수>,
  "oneliner": "<결과 상단에 노출할 한 줄 평>",
  "summary": "<관계 1-2문장 요약>",
  "good_points": ["<잘 맞는 점 1>", "<잘 맞는 점 2>"],
  "concerns": ["<우려되는 점 1>"],
  "metrics": {{
    "티키타카": <0-100>,
    "공통 화제": <0-100>,
    "분위기": <0-100>,
    "거리감": <0-100>
  }},
  "final_comment": "<최종 한마디>"
}}

**중요:**
- score 는 0-100 정수.
- good_points 1-5개, concerns 0-3개.
- 객관적이고 구체적으로 작성하세요.
- 반드시 위 JSON 형식으로만 응답하세요.
""".strip()


def format_transcript(messages: Iterable) -> str:
    """Render messages (sorted by turn_number) as `Agent A: ...\\nAgent B: ...`.

    `messages` may be either ORM `Message` rows or `MessageDTO` instances —
    anything with `.turn_number` and `.content` works.
    """
    lines = []
    for msg in messages:
        speaker = "Agent A" if msg.turn_number % 2 == 1 else "Agent B"
        lines.append(f"{speaker}: {msg.content}")
    return "\n".join(lines)


def build_chemistry_prompt(messages: Iterable) -> str:
    return CHEMISTRY_ANALYSIS_PROMPT.format(
        conversation_transcript=format_transcript(messages)
    )
