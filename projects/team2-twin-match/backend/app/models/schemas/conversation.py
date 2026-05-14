from typing import List, Optional

from pydantic import BaseModel

from app.models.dtos.conversation import ConversationDTO
from app.models.schemas.chemistry import ChemistryResp
from app.models.schemas.message import MessageResp


class MatchReq(BaseModel):
    agent_id: str


class ConversationResp(BaseModel):
    id: str
    agent_a_id: str
    agent_b_id: str
    status: str
    created_at: str
    completed_at: Optional[str] = None

    @classmethod
    def from_dto(cls, dto: ConversationDTO) -> "ConversationResp":
        return cls(
            id=dto.id,
            agent_a_id=dto.agent_a_id,
            agent_b_id=dto.agent_b_id,
            status=dto.status,
            created_at=dto.created_at,
            completed_at=dto.completed_at,
        )


class StartConversationResp(BaseModel):
    job_id: str
    message: str = "대화가 시작되었습니다"


class ConversationResultResp(BaseModel):
    conversation: ConversationResp
    messages: List[MessageResp]
    chemistry: Optional[ChemistryResp] = None


class ConversationMessagesResp(BaseModel):
    conversation: ConversationResp
    messages: List[MessageResp]
    latest_turn: int
