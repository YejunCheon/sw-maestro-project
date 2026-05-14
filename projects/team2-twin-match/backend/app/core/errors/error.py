"""Domain exceptions mapped to HTTP responses by `handler.py`.

The spec dictates an error response of `{"detail": "..."}` paired with the
appropriate HTTP status code. Services raise the domain-specific subclass; the
handler in `app/core/errors/handler.py` translates it.
"""

from starlette import status


class BaseAPIException(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "Internal Server Error"

    def __init__(self, detail: str | None = None):
        if detail is not None:
            self.detail = detail
        super().__init__(self.detail)


# 400 Bad Request -----------------------------------------------------------
class BadRequestException(BaseAPIException):
    status_code = status.HTTP_400_BAD_REQUEST


class PersonaTextTooShortException(BadRequestException):
    detail = "최소 50자 이상 입력해주세요."


class PersonaTextTooLongException(BadRequestException):
    detail = "페르소나 텍스트는 5000자를 초과할 수 없습니다."


class PersonaTextEmptyException(BadRequestException):
    detail = "페르소나 텍스트가 비어있습니다."


class NoMatchableAgentException(BadRequestException):
    detail = "매칭할 다른 Agent가 없습니다"


class ConversationAlreadyStartedException(BadRequestException):
    detail = "이미 시작되거나 진행 중인 대화입니다"


class ConversationAlreadyCompletedException(BadRequestException):
    detail = "이미 완료된 대화입니다"


class ConversationNotCompletedException(BadRequestException):
    detail = "대화가 완료되지 않았습니다"


class NoMessagesException(BadRequestException):
    detail = "대화 내역을 찾을 수 없습니다"


class InvalidUUIDException(BadRequestException):
    detail = "올바른 UUID 형식이 아닙니다"


# 404 Not Found -------------------------------------------------------------
class NotFoundException(BaseAPIException):
    status_code = status.HTTP_404_NOT_FOUND


class AgentNotFoundException(NotFoundException):
    detail = "Agent를 찾을 수 없습니다"


class ConversationNotFoundException(NotFoundException):
    detail = "대화 세션을 찾을 수 없습니다"


class ConversationResultNotFoundException(NotFoundException):
    detail = "대화 결과를 찾을 수 없습니다"


class JobNotFoundException(NotFoundException):
    detail = "작업을 찾을 수 없습니다"


# 500 Internal Server Error -------------------------------------------------
class InternalServerException(BaseAPIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


class DatabaseException(InternalServerException):
    detail = "데이터베이스 오류가 발생했습니다"


class SystemPromptGenerationFailed(InternalServerException):
    detail = "System Prompt 생성 실패"


class SolarAPIException(InternalServerException):
    detail = "Solar LLM API 호출 실패"


class ChemistryAnalysisFailed(InternalServerException):
    detail = "케미 분석 중 오류가 발생했습니다"


class JobCreationFailed(InternalServerException):
    detail = "작업 생성 실패"


class MatchmakerNotFoundException(InternalServerException):
    detail = "Matchmaker Agent를 찾을 수 없습니다"
