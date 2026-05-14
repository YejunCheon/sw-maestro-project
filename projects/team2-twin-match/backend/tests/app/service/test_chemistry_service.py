import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from app.core.errors.error import (
    ChemistryAnalysisFailed,
    ConversationNotCompletedException,
    NoMessagesException,
)
from app.models.db.agent import Agent
from app.models.dtos.chemistry import ChemistryDTO
from app.prompts.matchmaker_prompt import MATCHMAKER_SYSTEM_PROMPT
from app.repositories.agent_repository import AgentRepository
from app.repositories.chemistry_repository import ChemistryRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.services.chemistry_service import ChemistryService
from tests.app.conftest import make_agent

MATCHMAKER_AGENT_ID = "matchmaker-00000000-0000-0000-0000-000000000001"


async def _seed_matchmaker(db_session):
    """Matchmaker Agent 시드."""
    from sqlalchemy import select

    existing = (
        await db_session.execute(select(Agent).where(Agent.id == MATCHMAKER_AGENT_ID))
    ).scalar_one_or_none()
    if existing is not None:
        return

    db_session.add(
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
    await db_session.commit()


def _build_chemistry_service(db_session) -> ChemistryService:
    """ChemistryService 인스턴스 생성."""
    agent_repo = AgentRepository(db_session)
    conversation_repo = ConversationRepository(db_session)
    message_repo = MessageRepository(db_session)
    chemistry_repo = ChemistryRepository(db_session)
    return ChemistryService(
        agent_repository=agent_repo,
        conversation_repository=conversation_repo,
        message_repository=message_repo,
        chemistry_repository=chemistry_repo,
    )


async def _create_conversation_with_messages(db_session, status="completed"):
    """Conversation + Messages 시드."""
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")

    conv_repo = ConversationRepository(db_session)
    conv = await conv_repo.create(agent_a_id=a_id, agent_b_id=b_id)

    # 상태 변경
    if status != "pending":
        await conv_repo.update_status(conv.id, status=status)
        conv = await conv_repo.get_by_id(conv.id)

    # 메시지 추가
    if status == "completed":
        msg_repo = MessageRepository(db_session)
        await msg_repo.create(
            conversation_id=conv.id,
            agent_id=a_id,
            turn_number=1,
            content="안녕하세요",
        )
        await msg_repo.create(
            conversation_id=conv.id,
            agent_id=b_id,
            turn_number=2,
            content="반갑습니다",
        )

    return conv.id


@pytest.mark.asyncio
async def test_analyze_returns_cached_result(db_session):
    """캐시된 결과가 있으면 Solar 호출 없이 반환."""
    await _seed_matchmaker(db_session)
    conv_id = await _create_conversation_with_messages(db_session, status="completed")

    # 캐시 생성
    chemistry_repo = ChemistryRepository(db_session)
    cached_dto = ChemistryDTO(
        score=88,
        oneliner="환상의 호흡",
        summary="두 사람이 잘 맞습니다",
        good_points=["유머", "공감대"],
        concerns=["속도 차이"],
        metrics={"티키타카": 90, "공통 화제": 85},
        final_comment="추천합니다",
    )
    await chemistry_repo.create(conversation_id=conv_id, dto=cached_dto)

    service = _build_chemistry_service(db_session)
    result = await service.analyze(conv_id)

    assert result.score == 88
    assert result.oneliner == "환상의 호흡"


@pytest.mark.asyncio
async def test_analyze_raises_when_not_completed(db_session):
    """대화가 완료되지 않은 경우 예외 발생."""
    await _seed_matchmaker(db_session)
    conv_id = await _create_conversation_with_messages(db_session, status="processing")

    service = _build_chemistry_service(db_session)
    with pytest.raises(ConversationNotCompletedException):
        await service.analyze(conv_id)


@pytest.mark.asyncio
async def test_analyze_raises_when_no_messages(db_session):
    """메시지가 없는 경우 예외 발생."""
    await _seed_matchmaker(db_session)

    # 메시지 없는 completed conversation
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    conv_repo = ConversationRepository(db_session)
    conv = await conv_repo.create(agent_a_id=a_id, agent_b_id=b_id)
    await conv_repo.update_status(conv.id, status="completed")

    service = _build_chemistry_service(db_session)
    with pytest.raises(NoMessagesException):
        await service.analyze(conv.id)


@pytest.mark.asyncio
async def test_analyze_success_flow(db_session, monkeypatch):
    """정상 플로우: Solar 호출 → JSON 파싱 → 저장."""
    await _seed_matchmaker(db_session)
    conv_id = await _create_conversation_with_messages(db_session, status="completed")

    mock_solar = AsyncMock(
        return_value=json.dumps(
            {
                "score": 88,
                "oneliner": "환상의 호흡",
                "summary": "두 사람이 잘 맞습니다",
                "good_points": ["유머", "공감대"],
                "concerns": ["속도 차이"],
                "metrics": {"티키타카": 90, "공통 화제": 85, "분위기": 89},
                "final_comment": "추천합니다",
            }
        )
    )
    monkeypatch.setattr("app.core.solar_client.chat_completion", mock_solar)

    service = _build_chemistry_service(db_session)
    result = await service.analyze(conv_id)

    assert result.score == 88
    assert result.oneliner == "환상의 호흡"
    assert result.summary == "두 사람이 잘 맞습니다"
    assert result.good_points == ["유머", "공감대"]
    assert result.concerns == ["속도 차이"]
    assert result.metrics == {"티키타카": 90, "공통 화제": 85, "분위기": 89}
    assert result.final_comment == "추천합니다"
    assert mock_solar.await_count == 1


@pytest.mark.asyncio
async def test_analyze_handles_json_parse_error(db_session, monkeypatch):
    """JSON 파싱 실패 시 예외 발생."""
    await _seed_matchmaker(db_session)
    conv_id = await _create_conversation_with_messages(db_session, status="completed")

    mock_solar = AsyncMock(return_value="NOT JSON")
    monkeypatch.setattr("app.core.solar_client.chat_completion", mock_solar)

    service = _build_chemistry_service(db_session)
    with pytest.raises(ChemistryAnalysisFailed):
        await service.analyze(conv_id)


@pytest.mark.asyncio
async def test_analyze_fallback_on_invalid_score(db_session, monkeypatch):
    """score 범위 벗어나면 fallback (다른 필드는 유효)."""
    await _seed_matchmaker(db_session)
    conv_id = await _create_conversation_with_messages(db_session, status="completed")

    mock_solar = AsyncMock(
        return_value=json.dumps(
            {
                "score": 150,  # 범위 초과
                "oneliner": "테스트",
                "summary": "요약",
                "good_points": ["좋음"],  # 유효한 값
                "concerns": [],
                "metrics": {"티키타카": 80},  # 유효한 값
                "final_comment": "코멘트",
            }
        )
    )
    monkeypatch.setattr("app.core.solar_client.chat_completion", mock_solar)

    service = _build_chemistry_service(db_session)
    result = await service.analyze(conv_id)

    # score만 fallback됨
    assert result.score == 50
    assert result.oneliner == "테스트"
    assert result.good_points == ["좋음"]


@pytest.mark.asyncio
async def test_analyze_handles_missing_required_field(db_session, monkeypatch):
    """필수 필드 누락 시 예외 발생."""
    await _seed_matchmaker(db_session)
    conv_id = await _create_conversation_with_messages(db_session, status="completed")

    mock_solar = AsyncMock(
        return_value=json.dumps(
            {
                "score": 80,
                # oneliner 누락
                "summary": "요약",
                "final_comment": "코멘트",
            }
        )
    )
    monkeypatch.setattr("app.core.solar_client.chat_completion", mock_solar)

    service = _build_chemistry_service(db_session)
    with pytest.raises(ChemistryAnalysisFailed):
        await service.analyze(conv_id)


@pytest.mark.asyncio
async def test_analyze_handles_invalid_list_fields(db_session, monkeypatch):
    """good_points가 잘못된 타입이면 실패."""
    await _seed_matchmaker(db_session)
    conv_id = await _create_conversation_with_messages(db_session, status="completed")

    mock_solar = AsyncMock(
        return_value=json.dumps(
            {
                "score": 70,
                "oneliner": "테스트",
                "summary": "요약",
                "good_points": "not a list",  # 잘못된 타입
                "concerns": [],
                "metrics": {"티키타카": 80},
                "final_comment": "코멘트",
            }
        )
    )
    monkeypatch.setattr("app.core.solar_client.chat_completion", mock_solar)

    service = _build_chemistry_service(db_session)

    # 이제 실패 처리됨 (fallback 안 함)
    with pytest.raises(ChemistryAnalysisFailed):
        await service.analyze(conv_id)
