"""FR-001 / FR-002 endpoints."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, status

from app.core.errors.error import InvalidUUIDException
from app.models.schemas.agent import AgentCreateReq, AgentResp
from app.models.schemas.common import ErrorResponse
from app.routers.dependencies import get_agent_service
from app.services.agent_service import AgentService

router = APIRouter()


@router.post(
    "",
    response_model=AgentResp,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_agent(
    body: AgentCreateReq,
    service: AgentService = Depends(get_agent_service),
) -> AgentResp:
    """POST /api/agents — Clone Agent 생성."""
    dto = await service.create_clone_agent(body.to_dto())
    return AgentResp.from_dto(dto)


@router.get(
    "",
    response_model=List[AgentResp],
)
async def list_agents(
    service: AgentService = Depends(get_agent_service),
) -> List[AgentResp]:
    """GET /api/agents — Clone Agent 목록 (최신순)."""
    dtos = await service.list_clones()
    return [AgentResp.from_dto(dto) for dto in dtos]


@router.get(
    "/{agent_id}",
    response_model=AgentResp,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def read_agent(
    agent_id: str,
    service: AgentService = Depends(get_agent_service),
) -> AgentResp:
    """GET /api/agents/{agent_id} — 단일 Agent 조회."""
    try:
        uuid.UUID(agent_id)
    except ValueError:
        raise InvalidUUIDException()
    dto = await service.get_agent(agent_id)
    return AgentResp.from_dto(dto)
