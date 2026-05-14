"""Job CRUD against `jobs` table."""

import json
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.error import DatabaseException
from app.core.logger import logger
from app.models.db.job import Job
from app.models.dtos.job import JobDTO


class JobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, *, conversation_id: str) -> JobDTO:
        """Insert a new Job in `pending` state."""
        row = Job(conversation_id=conversation_id)
        try:
            self.db.add(row)
            await self.db.commit()
            await self.db.refresh(row)
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("job.create failed: %s", e)
            raise DatabaseException()
        return self._to_dto(row)

    async def get_by_id(self, job_id: str) -> Optional[JobDTO]:
        """JSON-decode `result` before returning the DTO."""
        try:
            stmt = select(Job).where(Job.id == job_id)
            result = await self.db.execute(stmt)
            row = result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error("job.get_by_id failed: %s", e)
            raise DatabaseException()
        return self._to_dto(row) if row else None

    async def update_status(
        self,
        job_id: str,
        *,
        status: str,
        result: Optional[Any] = None,
        error: Optional[str] = None,
    ) -> Optional[JobDTO]:
        """Update status; JSON-encode `result` when provided."""
        try:
            stmt = select(Job).where(Job.id == job_id)
            res = await self.db.execute(stmt)
            row = res.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error("job.update_status select failed: %s", e)
            raise DatabaseException()
        if row is None:
            return None
        row.status = status
        if result is not None:
            row.result = json.dumps(result, ensure_ascii=False)
        if error is not None:
            row.error = error
        row.updated_at = datetime.now(timezone.utc).isoformat()
        try:
            await self.db.commit()
            await self.db.refresh(row)
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("job.update_status commit failed: %s", e)
            raise DatabaseException()
        return self._to_dto(row)

    @staticmethod
    def _to_dto(row: Job) -> JobDTO:
        return JobDTO(
            id=row.id,
            conversation_id=row.conversation_id,
            status=row.status,
            result=json.loads(row.result) if row.result else None,
            error=row.error,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
