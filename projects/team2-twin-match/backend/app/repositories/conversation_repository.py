"""Conversation CRUD against `conversations` table."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.error import DatabaseException
from app.core.logger import logger
from app.models.db.conversation import Conversation
from app.models.dtos.conversation import ConversationDTO


class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, *, agent_a_id: str, agent_b_id: str
    ) -> ConversationDTO:
        """Insert a new Conversation with status='pending'."""
        row = Conversation(agent_a_id=agent_a_id, agent_b_id=agent_b_id)
        try:
            self.db.add(row)
            await self.db.commit()
            await self.db.refresh(row)
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("conversation.create failed: %s", e)
            raise DatabaseException()
        return self._to_dto(row)

    async def get_by_id(self, conversation_id: str) -> Optional[ConversationDTO]:
        try:
            stmt = select(Conversation).where(Conversation.id == conversation_id)
            result = await self.db.execute(stmt)
            row = result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error("conversation.get_by_id failed: %s", e)
            raise DatabaseException()
        return self._to_dto(row) if row else None

    async def update_status(
        self,
        conversation_id: str,
        *,
        status: str,
        completed_at: Optional[str] = None,
    ) -> Optional[ConversationDTO]:
        """Update status (and optionally completed_at)."""
        try:
            stmt = select(Conversation).where(Conversation.id == conversation_id)
            result = await self.db.execute(stmt)
            row = result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error("conversation.update_status select failed: %s", e)
            raise DatabaseException()
        if row is None:
            return None
        row.status = status
        if completed_at:
            row.completed_at = completed_at
        try:
            await self.db.commit()
            await self.db.refresh(row)
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("conversation.update_status commit failed: %s", e)
            raise DatabaseException()
        return self._to_dto(row)

    @staticmethod
    def _to_dto(row: Conversation) -> ConversationDTO:
        return ConversationDTO(
            id=row.id,
            agent_a_id=row.agent_a_id,
            agent_b_id=row.agent_b_id,
            status=row.status,
            created_at=row.created_at,
            completed_at=row.completed_at,
        )
