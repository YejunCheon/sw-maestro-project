import pytest

from app.core.errors.error import (
    AgentNotFoundException,
    ConversationAlreadyCompletedException,
    ConversationAlreadyStartedException,
    NoMatchableAgentException,
)
from app.repositories.agent_repository import AgentRepository
from app.repositories.chemistry_repository import ChemistryRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.job_repository import JobRepository
from app.repositories.message_repository import MessageRepository
from app.services.conversation_service import (
    ConversationService,
    _build_blind_date_system_prompt,
    _clean_agent_message,
)
from tests.app.conftest import make_agent


def _build_service(db_session) -> ConversationService:
    return ConversationService(
        agent_repository=AgentRepository(db_session),
        conversation_repository=ConversationRepository(db_session),
        message_repository=MessageRepository(db_session),
        chemistry_repository=ChemistryRepository(db_session),
        job_repository=JobRepository(db_session),
    )


@pytest.mark.asyncio
async def test_match_agents_success(db_session):
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")

    service = _build_service(db_session)
    result = await service.match_agents(a_id)

    assert result.agent_a_id == a_id
    assert result.agent_b_id == b_id
    assert result.status == "pending"


@pytest.mark.asyncio
async def test_match_agents_picks_from_pool(db_session):
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    c_id = await make_agent(db_session, "C")

    service = _build_service(db_session)
    result = await service.match_agents(a_id)

    assert result.agent_a_id == a_id
    assert result.agent_b_id in {b_id, c_id}


@pytest.mark.asyncio
async def test_match_agents_agent_not_found(db_session):
    service = _build_service(db_session)
    with pytest.raises(AgentNotFoundException):
        await service.match_agents("nonexistent-id")


@pytest.mark.asyncio
async def test_match_agents_no_candidates(db_session):
    a_id = await make_agent(db_session, "A")
    service = _build_service(db_session)
    with pytest.raises(NoMatchableAgentException):
        await service.match_agents(a_id)


@pytest.mark.asyncio
async def test_start_conversation_raises_when_processing(db_session):
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    service = _build_service(db_session)
    conv = await service.match_agents(a_id)

    conv_repo = service.conversation_repository
    await conv_repo.update_status(conv.id, status="processing")

    with pytest.raises(ConversationAlreadyStartedException):
        await service.start_conversation(conv.id)


@pytest.mark.asyncio
async def test_start_conversation_raises_when_completed(db_session):
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    service = _build_service(db_session)
    conv = await service.match_agents(a_id)

    conv_repo = service.conversation_repository
    await conv_repo.update_status(conv.id, status="completed")

    with pytest.raises(ConversationAlreadyCompletedException):
        await service.start_conversation(conv.id)


@pytest.mark.asyncio
async def test_get_conversation_messages_returns_after_turn_delta(db_session):
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    service = _build_service(db_session)
    conv = await service.conversation_repository.create(
        agent_a_id=a_id, agent_b_id=b_id
    )
    await service.message_repository.create(
        conversation_id=conv.id, agent_id=a_id, content="첫 메시지", turn_number=1
    )
    await service.message_repository.create(
        conversation_id=conv.id, agent_id=b_id, content="두 번째 메시지", turn_number=2
    )

    result = await service.get_conversation_messages(conv.id, after_turn=1)

    assert result.conversation.id == conv.id
    assert result.latest_turn == 2
    assert [message.turn_number for message in result.messages] == [2]


def test_clean_agent_message_removes_llm_meta_formatting():
    raw = (
        "**전시 이야기가 좋네요.** 저도 필름 질감을 좋아해요.\n\n"
        "최근에 기억에 남은 작품이 있었나요?\n\n"
        "(참고: 마지막 질문에서 반복된 문맥을 피하며 일관성을 유지했습니다.)"
    )

    assert _clean_agent_message(raw) == (
        "전시 이야기가 좋네요. 저도 필름 질감을 좋아해요.\n\n"
        "최근에 기억에 남은 작품이 있었나요?"
    )


def test_clean_agent_message_keeps_last_revised_dialogue_only():
    raw = (
        "카라멜라떼 준비하며 기다리겠습니다. 😊1\n"
        "<>\n\n"
        "(차분한 분위기와 차분한 말투 유지 버전으로 재설정 중입니다)\n\n"
        "카라멜라떼 준비하며 여유롭게 카페에서 기다리겠어요. "
        "벚꽃 길에서 마주할 표정도 벌써부터 설레네요."
    )

    assert _clean_agent_message(raw) == (
        "카라멜라떼 준비하며 여유롭게 카페에서 기다리겠어요. "
        "벚꽃 길에서 마주할 표정도 벌써부터 설레네요."
    )


def test_build_blind_date_system_prompt_includes_scene_and_counterpart():
    agent = type(
        "Agent",
        (),
        {
            "system_prompt": "나는 조심스럽게 말하는 사람입니다.",
        },
    )()
    counterpart = type(
        "Agent",
        (),
        {
            "name": "서연",
            "age": 27,
            "job": "브랜드 마케터",
            "tags": ["#전시", "#카페"],
            "persona_text": "전시와 작은 카페를 좋아합니다.",
        },
    )()

    prompt = _build_blind_date_system_prompt(agent, counterpart)

    assert "카카오톡으로 어색하게 첫 대화" in prompt
    assert "상대방 프로필" in prompt
    assert "서연" in prompt
    assert "#전시, #카페" in prompt
    assert "상대방의 페르소나를 대신 연기하지 말고" in prompt
