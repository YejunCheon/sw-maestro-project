import pytest

from app.repositories.conversation_repository import ConversationRepository
from tests.app.conftest import make_agent


@pytest.mark.asyncio
async def test_create_round_trip(db_session):
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")

    repo = ConversationRepository(db_session)
    created = await repo.create(agent_a_id=a_id, agent_b_id=b_id)

    assert created.id
    assert created.agent_a_id == a_id
    assert created.agent_b_id == b_id
    assert created.status == "pending"
    assert created.completed_at is None

    fetched = await repo.get_by_id(created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.status == "pending"



@pytest.mark.asyncio
async def test_get_by_id_returns_none_when_missing(db_session):
    repo = ConversationRepository(db_session)
    assert await repo.get_by_id("nonexistent-id") is None
