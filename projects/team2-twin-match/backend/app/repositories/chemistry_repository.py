"""ChemistryAnalysis CRUD against `chemistry_analyses` table."""

import json
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.error import DatabaseException
from app.core.logger import logger
from app.models.db.chemistry import ChemistryAnalysis
from app.models.dtos.chemistry import ChemistryDTO


class ChemistryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _to_dto(self, row: ChemistryAnalysis) -> ChemistryDTO:
        """ORM row → DTO with JSON decoding."""
        return ChemistryDTO(
            score=row.score,
            oneliner=row.oneliner,
            summary=row.summary,
            good_points=json.loads(row.good_points),
            concerns=json.loads(row.concerns),
            metrics=json.loads(row.metrics),
            final_comment=row.final_comment,
        )

    async def get_by_conversation(self, conversation_id: str) -> Optional[ChemistryDTO]:
        """Return the cached analysis for `conversation_id`, or `None`."""
        try:
            stmt = select(ChemistryAnalysis).where(
                ChemistryAnalysis.conversation_id == conversation_id
            )
            result = await self.db.execute(stmt)
            row = result.scalar_one_or_none()

            if row is None:
                return None

            return self._to_dto(row)
        except SQLAlchemyError as e:
            logger.error("Chemistry 조회 실패: %s", e)
            raise DatabaseException()

    async def create(
        self, *, conversation_id: str, dto: ChemistryDTO
    ) -> ChemistryDTO:
        """Persist a fresh analysis. JSON-encode list/dict fields before insert."""
        try:
            row = ChemistryAnalysis(
                conversation_id=conversation_id,
                score=dto.score,
                oneliner=dto.oneliner,
                summary=dto.summary,
                good_points=json.dumps(dto.good_points, ensure_ascii=False),
                concerns=json.dumps(dto.concerns, ensure_ascii=False),
                metrics=json.dumps(dto.metrics, ensure_ascii=False),
                final_comment=dto.final_comment,
            )

            self.db.add(row)
            await self.db.commit()
            await self.db.refresh(row)

            return self._to_dto(row)
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("Chemistry 저장 실패: %s", e)
            raise DatabaseException()
