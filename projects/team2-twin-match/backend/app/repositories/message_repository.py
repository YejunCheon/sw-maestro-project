"""Message CRUD against `messages` table."""

from typing import List

from sqlalchemy import asc, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.error import DatabaseException
from app.core.logger import logger
from app.models.db.message import Message
from app.models.dtos.message import MessageDTO


class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        *,
        conversation_id: str,
        agent_id: str,
        content: str,
        turn_number: int,
    ) -> MessageDTO:
        row = Message(
            conversation_id=conversation_id,
            agent_id=agent_id,
            content=content,
            turn_number=turn_number,
        )
        try:
            self.db.add(row)
            await self.db.commit()
            await self.db.refresh(row)
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("message.create failed: %s", e)
            raise DatabaseException()
        return self._to_dto(row)

    async def list_by_conversation(
        self, conversation_id: str, *, after_turn: int | None = None
    ) -> List[MessageDTO]:
        """Return messages ordered by `turn_number` ascending."""
        try:
            stmt = (
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(asc(Message.turn_number))
            )
            if after_turn is not None:
                stmt = stmt.where(Message.turn_number > after_turn)
            result = await self.db.execute(stmt)
            rows = result.scalars().all()
        except SQLAlchemyError as e:
            logger.error("message.list_by_conversation failed: %s", e)
            raise DatabaseException()
        return [self._to_dto(row) for row in rows]

    @staticmethod
    def _to_dto(row: Message) -> MessageDTO:
        return MessageDTO(
            id=row.id,
            conversation_id=row.conversation_id,
            agent_id=row.agent_id,
            content=row.content,
            turn_number=row.turn_number,
            created_at=row.created_at,
        )
