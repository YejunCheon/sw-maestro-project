import pytest

from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from tests.app.conftest import make_agent


@pytest.mark.asyncio
async def test_list_by_conversation_filters_after_turn(db_session):
    a_id = await make_agent(db_session, "A")
    b_id = await make_agent(db_session, "B")
    conv = await ConversationRepository(db_session).create(
        agent_a_id=a_id, agent_b_id=b_id
    )
    repo = MessageRepository(db_session)

    await repo.create(
        conversation_id=conv.id, agent_id=a_id, content="첫 메시지", turn_number=1
    )
    await repo.create(
        conversation_id=conv.id, agent_id=b_id, content="두 번째 메시지", turn_number=2
    )
    await repo.create(
        conversation_id=conv.id, agent_id=a_id, content="세 번째 메시지", turn_number=3
    )

    messages = await repo.list_by_conversation(conv.id, after_turn=1)

    assert [message.turn_number for message in messages] == [2, 3]
