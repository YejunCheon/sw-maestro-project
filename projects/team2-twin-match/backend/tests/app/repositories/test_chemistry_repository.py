import pytest

from app.models.dtos.chemistry import ChemistryDTO
from app.repositories.chemistry_repository import ChemistryRepository
from app.repositories.conversation_repository import ConversationRepository
from tests.app.conftest import make_agent


@pytest.mark.asyncio
async def test_get_by_conversation_returns_none_when_missing(db_session):
    """존재하지 않는 conversation_id 조회 시 None 반환."""
    repo = ChemistryRepository(db_session)
    result = await repo.get_by_conversation("nonexistent-id")
    assert result is None


@pytest.mark.asyncio
async def test_create_and_get_round_trip(db_session):
    """저장 후 조회 시 동일한 데이터 반환."""
    # Conversation 시드
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    conv_repo = ConversationRepository(db_session)
    conv = await conv_repo.create(agent_a_id=a_id, agent_b_id=b_id)

    dto = ChemistryDTO(
        score=85,
        oneliner="찰떡궁합",
        summary="두 사람의 대화가 자연스럽습니다",
        good_points=["공통 관심사", "유머 코드 일치"],
        concerns=["약간의 온도 차이"],
        metrics={"티키타카": 90, "공통 화제": 80},
        final_comment="좋은 인연이 될 것 같습니다",
    )

    repo = ChemistryRepository(db_session)
    saved = await repo.create(conversation_id=conv.id, dto=dto)

    assert saved.score == 85
    assert saved.oneliner == "찰떡궁합"
    assert len(saved.good_points) == 2
    assert saved.good_points == ["공통 관심사", "유머 코드 일치"]

    # 캐시 조회
    cached = await repo.get_by_conversation(conv.id)
    assert cached is not None
    assert cached.score == 85
    assert cached.oneliner == "찰떡궁합"
    assert cached.good_points == ["공통 관심사", "유머 코드 일치"]
    assert cached.concerns == ["약간의 온도 차이"]
    assert cached.metrics == {"티키타카": 90, "공통 화제": 80}
    assert cached.final_comment == "좋은 인연이 될 것 같습니다"


@pytest.mark.asyncio
async def test_json_fields_encoding_decoding(db_session):
    """한글 포함 JSON 필드 인코딩/디코딩 검증."""
    # Conversation 시드
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    conv_repo = ConversationRepository(db_session)
    conv = await conv_repo.create(agent_a_id=a_id, agent_b_id=b_id)

    dto = ChemistryDTO(
        score=75,
        oneliner="괜찮은 케미",
        summary="보통",
        good_points=["한글 태그1", "한글 태그2"],
        concerns=["우려사항 한글"],
        metrics={"티키타카": 70, "분위기": 80},
        final_comment="한글 코멘트",
    )

    repo = ChemistryRepository(db_session)
    saved = await repo.create(conversation_id=conv.id, dto=dto)

    assert saved.good_points == ["한글 태그1", "한글 태그2"]
    assert saved.concerns == ["우려사항 한글"]
    assert saved.final_comment == "한글 코멘트"
    assert saved.oneliner == "괜찮은 케미"

    # 재조회 후 한글 검증
    cached = await repo.get_by_conversation(conv.id)
    assert cached is not None
    assert cached.good_points == ["한글 태그1", "한글 태그2"]
    assert cached.concerns == ["우려사항 한글"]
    assert cached.final_comment == "한글 코멘트"
