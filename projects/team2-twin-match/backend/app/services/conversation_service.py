"""FR-003 / FR-004: 매칭 및 20턴 대화 시뮬레이션."""

import random
import re
from datetime import datetime, timezone
from typing import Tuple

from app.core.errors.error import (
    AgentNotFoundException,
    ConversationAlreadyCompletedException,
    ConversationAlreadyStartedException,
    ConversationNotFoundException,
    ConversationResultNotFoundException,
    NoMatchableAgentException,
)
from app.models.dtos.agent import AgentDTO
from app.models.dtos.conversation import ConversationDTO
from app.models.schemas.chemistry import ChemistryResp
from app.models.schemas.conversation import (
    ConversationMessagesResp,
    ConversationResp,
    ConversationResultResp,
)
from app.models.schemas.message import MessageResp
from app.repositories.agent_repository import AgentRepository
from app.repositories.chemistry_repository import ChemistryRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.job_repository import JobRepository
from app.repositories.message_repository import MessageRepository

TOTAL_TURNS = 20
META_LINE_RE = re.compile(r"^\s*[\(（].*")
BOLD_MARK_RE = re.compile(r"\*\*(.*?)\*\*")
SEGMENT_SPLIT_RE = re.compile(r"(?:</?think>|\n\s*---+\s*\n|<>)")
RESET_META_KEYWORDS = (
    "수정",
    "재설정",
    "아래",
    "버전",
    "반영",
)
BLIND_DATE_SCENE = """
지금은 처음 매칭된 소개팅 상대와 카카오톡으로 어색하게 첫 대화를 나누는 상황입니다.
두 사람은 서로의 프로필을 가볍게 읽은 상태지만 아직 친하지 않습니다.
너무 빠르게 약속을 잡거나 깊은 고백을 하지 말고, 조금 조심스럽고 자연스럽게 서로를 알아가세요.
상대방의 프로필을 참고하되, 상대방의 페르소나를 대신 연기하지 말고 당신 자신의 페르소나로만 답하세요.
""".strip()


def _clean_agent_message(content: str) -> str:
    cleaned = BOLD_MARK_RE.sub(r"\1", content).strip()
    candidates: list[str] = []

    for segment in SEGMENT_SPLIT_RE.split(cleaned):
        lines: list[str] = []
        for raw_line in segment.splitlines():
            line = raw_line.rstrip()
            stripped = line.strip()
            if not stripped:
                if lines and lines[-1] != "":
                    lines.append("")
                continue
            if stripped.startswith("<"):
                continue
            if META_LINE_RE.match(stripped):
                if any(keyword in stripped for keyword in RESET_META_KEYWORDS):
                    lines = []
                continue
            lines.append(line)

        text = "\n".join(lines).strip()
        if text:
            candidates.append(text)

    if not candidates:
        return cleaned
    return candidates[-1]


def _build_blind_date_system_prompt(agent: AgentDTO, counterpart: AgentDTO) -> str:
    counterpart_bits = [
        f"이름: {counterpart.name or '알 수 없음'}",
        f"나이: {counterpart.age or '알 수 없음'}",
        f"직업: {counterpart.job or '알 수 없음'}",
    ]
    if counterpart.tags:
        counterpart_bits.append(f"태그: {', '.join(counterpart.tags)}")
    if counterpart.persona_text:
        counterpart_bits.append(f"상대방 페르소나 요약: {counterpart.persona_text}")

    return (
        f"{agent.system_prompt}\n\n"
        f"**현재 대화 상황:**\n{BLIND_DATE_SCENE}\n\n"
        f"**상대방 프로필:**\n" + "\n".join(counterpart_bits)
    )


class ConversationService:
    def __init__(
        self,
        agent_repository: AgentRepository,
        conversation_repository: ConversationRepository,
        message_repository: MessageRepository,
        chemistry_repository: ChemistryRepository,
        job_repository: JobRepository,
    ):
        self.agent_repository = agent_repository
        self.conversation_repository = conversation_repository
        self.message_repository = message_repository
        self.chemistry_repository = chemistry_repository
        self.job_repository = job_repository

    async def match_agents(self, agent_id: str) -> ConversationDTO:
        # Skeleton: validate input + raise sensible domain errors.
        requester = await self.agent_repository.get_by_id(agent_id)
        if requester is None:
            raise AgentNotFoundException()

        candidates = await self.agent_repository.list_clones_excluding(agent_id)
        if not candidates:
            raise NoMatchableAgentException()

        selected = random.choice(candidates)
        return await self.conversation_repository.create(
            agent_a_id=agent_id,
            agent_b_id=selected.id,
        )

    async def start_conversation(self, conversation_id: str) -> Tuple[str, str]:
        """Returns `(job_id, message)`. Caller adds `run_conversation_loop` to BG tasks."""
        conv = await self.conversation_repository.get_by_id(conversation_id)
        if conv is None:
            raise ConversationNotFoundException()
        if conv.status == "processing":
            raise ConversationAlreadyStartedException()
        if conv.status in ("completed", "failed"):
            raise ConversationAlreadyCompletedException()

        job = await self.job_repository.create(conversation_id=conversation_id)
        return (job.id, "대화가 시작되었습니다")

    async def run_conversation_loop(self, conversation_id: str, job_id: str) -> None:
        """Background-task entrypoint. Must own its own DB session lifecycle.

        BackgroundTasks runs after the request session is closed, so do **not**
        reuse `self.*_repository` here. Open a fresh `async_session_factory()`
        session and instantiate repositories inside this method.
        """
        from app.core import solar_client
        from app.core.db.session import async_session_factory

        async with async_session_factory() as db:
            conv_repo = ConversationRepository(db)
            msg_repo = MessageRepository(db)
            job_repo = JobRepository(db)
            agent_repo = AgentRepository(db)

            try:
                await conv_repo.update_status(conversation_id, status="processing")
                await job_repo.update_status(job_id, status="processing")
                conv = await conv_repo.get_by_id(conversation_id)
                agent_a = await agent_repo.get_by_id(conv.agent_a_id)
                agent_b = await agent_repo.get_by_id(conv.agent_b_id)
                prompt_a = _build_blind_date_system_prompt(agent_a, agent_b)
                prompt_b = _build_blind_date_system_prompt(agent_b, agent_a)

                context_a, context_b = [], []

                for turn in range(1, TOTAL_TURNS + 1):
                    # Agent A → 홀수 turn_number (1, 3, 5, ..., 39)
                    msg_a = await solar_client.chat_completion(
                        prompt_a,
                        context_a,
                        temperature=0.8,
                        max_tokens=200,
                        extra={"frequency_penalty": 0.3, "presence_penalty": 0.3},
                    )
                    msg_a = _clean_agent_message(msg_a)
                    await msg_repo.create(
                        conversation_id=conversation_id,
                        agent_id=agent_a.id,
                        content=msg_a,
                        turn_number=turn * 2 - 1,
                    )
                    context_a.append({"role": "assistant", "content": msg_a})
                    context_b.append({"role": "user", "content": msg_a})

                    # Agent B → 짝수 turn_number (2, 4, 6, ..., 40)
                    msg_b = await solar_client.chat_completion(
                        prompt_b,
                        context_b,
                        temperature=0.8,
                        max_tokens=200,
                        extra={"frequency_penalty": 0.3, "presence_penalty": 0.3},
                    )
                    msg_b = _clean_agent_message(msg_b)
                    await msg_repo.create(
                        conversation_id=conversation_id,
                        agent_id=agent_b.id,
                        content=msg_b,
                        turn_number=turn * 2,
                    )
                    context_b.append({"role": "assistant", "content": msg_b})
                    context_a.append({"role": "user", "content": msg_b})

                completed_at = datetime.now(timezone.utc).isoformat()
                await conv_repo.update_status(
                    conversation_id, status="completed", completed_at=completed_at
                )
                await job_repo.update_status(
                    job_id,
                    status="completed",
                    result={
                        "conversation_id": conversation_id,
                        "message_count": TOTAL_TURNS * 2,
                    },
                )

            except Exception as e:
                # 부분 저장된 메시지는 보존 (각 create()가 이미 commit)
                await conv_repo.update_status(conversation_id, status="failed")
                await job_repo.update_status(job_id, status="failed", error=str(e))

    async def get_conversation_result(
        self, conversation_id: str
    ) -> ConversationResultResp:
        conv = await self.conversation_repository.get_by_id(conversation_id)
        if conv is None:
            raise ConversationResultNotFoundException()

        messages = await self.message_repository.list_by_conversation(conversation_id)
        chemistry = await self.chemistry_repository.get_by_conversation(conversation_id)
        return ConversationResultResp(
            conversation=ConversationResp.from_dto(conv),
            messages=[MessageResp.from_dto(m) for m in messages],
            chemistry=ChemistryResp.from_dto(chemistry) if chemistry else None,
        )

    async def get_conversation_messages(
        self, conversation_id: str, *, after_turn: int = 0
    ) -> ConversationMessagesResp:
        conv = await self.conversation_repository.get_by_id(conversation_id)
        if conv is None:
            raise ConversationNotFoundException()

        messages = await self.message_repository.list_by_conversation(
            conversation_id, after_turn=after_turn
        )
        latest_turn = max(
            (message.turn_number for message in messages), default=after_turn
        )
        return ConversationMessagesResp(
            conversation=ConversationResp.from_dto(conv),
            messages=[MessageResp.from_dto(m) for m in messages],
            latest_turn=latest_turn,
        )
