import pytest

from tests.app.conftest import make_agent
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository


@pytest.mark.asyncio
async def test_match_returns_201(client_with_db, db_session):
    a_id = await make_agent(db_session, "A")
    await make_agent(db_session, "B")

    res = await client_with_db.post("/api/conversations/match", json={"agent_id": a_id})
    assert res.status_code == 201

    body = res.json()
    assert body["agent_a_id"] == a_id
    assert body["status"] == "pending"
    assert body["completed_at"] is None


@pytest.mark.asyncio
async def test_match_agent_not_found_returns_404(client_with_db):
    res = await client_with_db.post(
        "/api/conversations/match",
        json={"agent_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert res.status_code == 404
    assert res.json() == {"detail": "Agent를 찾을 수 없습니다"}


@pytest.mark.asyncio
async def test_match_no_candidates_returns_400(client_with_db, db_session):
    a_id = await make_agent(db_session, "A")

    res = await client_with_db.post("/api/conversations/match", json={"agent_id": a_id})
    assert res.status_code == 400
    assert res.json() == {"detail": "매칭할 다른 Agent가 없습니다"}


@pytest.mark.asyncio
async def test_get_messages_returns_delta_during_processing(client_with_db, db_session):
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    conv_repo = ConversationRepository(db_session)
    conv = await conv_repo.create(agent_a_id=a_id, agent_b_id=b_id)
    await conv_repo.update_status(conv.id, status="processing")

    msg_repo = MessageRepository(db_session)
    await msg_repo.create(
        conversation_id=conv.id, agent_id=a_id, content="안녕하세요", turn_number=1
    )
    await msg_repo.create(
        conversation_id=conv.id, agent_id=b_id, content="반가워요", turn_number=2
    )

    res = await client_with_db.get(
        f"/api/conversations/{conv.id}/messages?after_turn=1"
    )

    assert res.status_code == 200
    body = res.json()
    assert body["conversation"]["status"] == "processing"
    assert body["latest_turn"] == 2
    assert [message["turn_number"] for message in body["messages"]] == [2]
