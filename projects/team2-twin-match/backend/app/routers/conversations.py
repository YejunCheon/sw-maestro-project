"""FR-003 / FR-004 / FR-005 endpoints."""

from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.models.schemas.chemistry import ChemistryResp
from app.models.schemas.common import ErrorResponse
from app.models.schemas.conversation import (
    ConversationMessagesResp,
    ConversationResp,
    ConversationResultResp,
    MatchReq,
    StartConversationResp,
)
from app.routers.dependencies import (
    get_chemistry_service,
    get_conversation_service,
)
from app.services.chemistry_service import ChemistryService
from app.services.conversation_service import ConversationService

router = APIRouter()


@router.post(
    "/match",
    response_model=ConversationResp,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def match(
    body: MatchReq,
    service: ConversationService = Depends(get_conversation_service),
) -> ConversationResp:
    """POST /api/conversations/match — Strategy A: 즉시 랜덤 매칭."""
    dto = await service.match_agents(body.agent_id)
    return ConversationResp.from_dto(dto)


@router.post(
    "/{conversation_id}/start",
    response_model=StartConversationResp,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def start_conversation(
    conversation_id: str,
    background_tasks: BackgroundTasks,
    service: ConversationService = Depends(get_conversation_service),
) -> StartConversationResp:
    """POST /api/conversations/{id}/start — 비동기 20턴 대화 실행."""
    job_id, message = await service.start_conversation(conversation_id)
    background_tasks.add_task(service.run_conversation_loop, conversation_id, job_id)
    return StartConversationResp(job_id=job_id, message=message)


@router.get(
    "/{conversation_id}/messages",
    response_model=ConversationMessagesResp,
    responses={404: {"model": ErrorResponse}},
)
async def get_messages(
    conversation_id: str,
    after_turn: int = 0,
    service: ConversationService = Depends(get_conversation_service),
) -> ConversationMessagesResp:
    """GET /api/conversations/{id}/messages — 대화 중 생성된 메시지 변화분."""
    return await service.get_conversation_messages(
        conversation_id, after_turn=after_turn
    )


@router.get(
    "/{conversation_id}/result",
    response_model=ConversationResultResp,
    responses={404: {"model": ErrorResponse}},
)
async def get_result(
    conversation_id: str,
    service: ConversationService = Depends(get_conversation_service),
) -> ConversationResultResp:
    """GET /api/conversations/{id}/result — 대화 + 메시지 + 케미."""
    return await service.get_conversation_result(conversation_id)


@router.post(
    "/{conversation_id}/analyze",
    response_model=ChemistryResp,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def analyze(
    conversation_id: str,
    service: ChemistryService = Depends(get_chemistry_service),
) -> ChemistryResp:
    """POST /api/conversations/{id}/analyze — Matchmaker Agent 케미 분석."""
    dto = await service.analyze(conversation_id)
    return ChemistryResp.from_dto(dto)
