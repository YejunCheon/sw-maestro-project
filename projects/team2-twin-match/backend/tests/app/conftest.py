import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from app.core.db.session import Base
from app.main import create_app
from app.repositories.agent_repository import AgentRepository

# Import all models so they are registered on Base.metadata before create_all.
from app.models.db import agent, chemistry, conversation, job, message  # noqa: F401


@pytest.fixture
def app():
    return create_app()


@pytest_asyncio.fixture
async def async_client(app) -> AsyncClient:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest_asyncio.fixture
async def db_engine():
    """In-memory SQLite engine with a shared connection.

    `StaticPool` keeps the in-memory DB alive across sessions in the same test —
    without it every new connection would see an empty DB.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncSession:
    factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def client_with_db(app, db_engine) -> AsyncClient:
    """HTTP client whose `get_db` Depends is rewired to the test in-memory engine.

    Fixture-side `db_session` (when also requested by a test) shares the same
    `db_engine`, so seeded rows are visible through the HTTP client.
    """
    from app.core.db.session import get_db

    factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
    app.dependency_overrides.clear()


async def make_agent(db_session: AsyncSession, name: str) -> str:
    repo = AgentRepository(db_session)
    dto = await repo.create_clone(
        name=name,
        age=25,
        gender="M",
        job="개발자",
        tags=[],
        persona_text=f"{name} 페르소나 텍스트입니다. 충분히 길게 작성합니다.",
        system_prompt="sys",
    )
    return dto.id
