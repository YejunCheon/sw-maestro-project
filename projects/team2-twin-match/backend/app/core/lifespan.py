from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json

from fastapi import FastAPI
from sqlalchemy import select

from app.core.db.session import async_session_factory, close_db, init_db, ping_db
from app.core.logger import logger
from app.prompts.agent_prompt import build_system_prompt
from app.prompts.matchmaker_prompt import MATCHMAKER_SYSTEM_PROMPT


MATCHMAKER_AGENT_ID = "matchmaker-00000000-0000-0000-0000-000000000001"

DEMO_CLONE_AGENT_SEEDS = [
    {
        "id": "00000000-0000-4000-8000-000000000101",
        "name": "서연",
        "age": 27,
        "gender": "F",
        "job": "브랜드 마케터",
        "tags": ["#ENFP", "#전시", "#카페"],
        "persona_text": (
            "저는 27세 브랜드 마케터입니다. 새로운 전시와 작은 카페를 찾아다니는 걸 좋아하고, "
            "처음 만난 사람과도 편안하게 이야기를 이어가는 편입니다. 상대가 좋아하는 취향을 "
            "물어보고 기억하는 걸 중요하게 생각해요."
        ),
    },
    {
        "id": "00000000-0000-4000-8000-000000000102",
        "name": "하린",
        "age": 29,
        "gender": "F",
        "job": "UX 디자이너",
        "tags": ["#INFJ", "#독서", "#산책"],
        "persona_text": (
            "저는 29세 UX 디자이너입니다. 조용한 서점과 한강 산책을 좋아하고, 대화할 때는 "
            "상대의 말 뒤에 있는 감정을 천천히 이해하려고 합니다. 낯은 조금 가리지만 깊은 "
            "주제가 나오면 오래 이야기할 수 있어요."
        ),
    },
    {
        "id": "00000000-0000-4000-8000-000000000103",
        "name": "지우",
        "age": 25,
        "gender": "F",
        "job": "데이터 분석가",
        "tags": ["#ISTJ", "#러닝", "#맛집"],
        "persona_text": (
            "저는 25세 데이터 분석가입니다. 평일에는 계획적으로 지내지만 주말에는 새로운 맛집을 "
            "찾거나 러닝 모임에 나갑니다. 대화에서는 솔직하고 담백한 편이고, 약속과 배려를 "
            "중요하게 생각합니다."
        ),
    },
    {
        "id": "00000000-0000-4000-8000-000000000201",
        "name": "민준",
        "age": 28,
        "gender": "M",
        "job": "백엔드 개발자",
        "tags": ["#INTP", "#등산", "#필름카메라"],
        "persona_text": (
            "저는 28세 백엔드 개발자입니다. 기술 이야기를 깊게 파고드는 걸 좋아하고, 주말에는 "
            "근교 산을 걷거나 필름 카메라로 동네 풍경을 찍습니다. 처음엔 담백하지만 친해지면 "
            "은근히 장난도 치는 편입니다."
        ),
    },
    {
        "id": "00000000-0000-4000-8000-000000000202",
        "name": "도윤",
        "age": 31,
        "gender": "M",
        "job": "프로덕트 매니저",
        "tags": ["#ENTJ", "#와인", "#기획"],
        "persona_text": (
            "저는 31세 프로덕트 매니저입니다. 일과 삶 모두에서 좋은 질문을 던지는 사람을 좋아하고, "
            "퇴근 후에는 와인바나 재즈 공연을 종종 갑니다. 대화는 적극적으로 이끌지만 상대의 "
            "속도에 맞추려고 노력합니다."
        ),
    },
    {
        "id": "00000000-0000-4000-8000-000000000203",
        "name": "준호",
        "age": 26,
        "gender": "M",
        "job": "영상 편집자",
        "tags": ["#ISFP", "#영화", "#요리"],
        "persona_text": (
            "저는 26세 영상 편집자입니다. 오래된 영화와 집에서 만드는 파스타를 좋아하고, 감각적인 "
            "이야기나 음악 취향을 나누는 걸 즐깁니다. 말수가 많진 않지만 리액션이 부드럽고 "
            "편안한 분위기를 만들려고 합니다."
        ),
    },
]


async def _ensure_matchmaker_agent() -> None:
    """Seed the Matchmaker Agent on first boot (idempotent)."""
    from app.models.db.agent import Agent

    async with async_session_factory() as session:
        existing = (
            await session.execute(select(Agent).where(Agent.id == MATCHMAKER_AGENT_ID))
        ).scalar_one_or_none()
        if existing is not None:
            return

        session.add(
            Agent(
                id=MATCHMAKER_AGENT_ID,
                agent_type="matchmaker",
                name=None,
                age=None,
                gender=None,
                job=None,
                tags=None,
                persona_text=None,
                system_prompt=MATCHMAKER_SYSTEM_PROMPT,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
        )
        await session.commit()
        logger.info("Matchmaker Agent seeded (id=%s)", MATCHMAKER_AGENT_ID)


async def _ensure_demo_clone_agents() -> None:
    """Seed demo Clone Agents so local matching has an actual online pool."""
    from app.models.db.agent import Agent

    seed_ids = [seed["id"] for seed in DEMO_CLONE_AGENT_SEEDS]
    async with async_session_factory() as session:
        existing_rows = {
            row.id: row
            for row in (
                await session.execute(select(Agent).where(Agent.id.in_(seed_ids)))
            )
            .scalars()
            .all()
        }
        now = datetime.now(timezone.utc).isoformat()
        inserted_count = 0
        updated_count = 0

        for seed in DEMO_CLONE_AGENT_SEEDS:
            system_prompt = build_system_prompt(seed["persona_text"])
            row = existing_rows.get(seed["id"])
            if row is None:
                session.add(
                    Agent(
                        id=seed["id"],
                        agent_type="clone",
                        name=seed["name"],
                        age=seed["age"],
                        gender=seed["gender"],
                        job=seed["job"],
                        tags=json.dumps(seed["tags"], ensure_ascii=False),
                        persona_text=seed["persona_text"],
                        system_prompt=system_prompt,
                        created_at=now,
                    )
                )
                inserted_count += 1
                continue

            row.name = seed["name"]
            row.age = seed["age"]
            row.gender = seed["gender"]
            row.job = seed["job"]
            row.tags = json.dumps(seed["tags"], ensure_ascii=False)
            row.persona_text = seed["persona_text"]
            row.system_prompt = system_prompt
            updated_count += 1

        if inserted_count == 0 and updated_count == 0:
            return

        await session.commit()
        logger.info(
            "Demo Clone Agents ensured (inserted=%s, updated=%s)",
            inserted_count,
            updated_count,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await ping_db()
    await _ensure_matchmaker_agent()
    await _ensure_demo_clone_agents()

    yield

    await close_db()
