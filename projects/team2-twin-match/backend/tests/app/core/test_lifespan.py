import json

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core import lifespan
from app.models.db.agent import Agent


@pytest.mark.asyncio
async def test_demo_clone_agents_seeded_idempotently(db_engine, monkeypatch):
    factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    monkeypatch.setattr(lifespan, "async_session_factory", factory)

    await lifespan._ensure_demo_clone_agents()
    await lifespan._ensure_demo_clone_agents()

    async with factory() as session:
        result = await session.execute(select(Agent).where(Agent.agent_type == "clone"))
        clones = result.scalars().all()

    assert len(clones) == 6
    assert sum(1 for clone in clones if clone.gender == "F") == 3
    assert sum(1 for clone in clones if clone.gender == "M") == 3
    assert len({clone.id for clone in clones}) == 6
    assert all(clone.system_prompt.startswith(clone.persona_text) for clone in clones)
    assert json.loads(clones[0].tags)
