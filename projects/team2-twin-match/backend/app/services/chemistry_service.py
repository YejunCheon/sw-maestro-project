"""FR-005: Matchmaker Agent 기반 케미 분석."""

import json

from app.core import solar_client
from app.core.errors.error import (
    ChemistryAnalysisFailed,
    ConversationNotCompletedException,
    ConversationNotFoundException,
    MatchmakerNotFoundException,
    NoMessagesException,
)
from app.core.logger import logger
from app.models.dtos.chemistry import ChemistryDTO
from app.prompts.chemistry_prompt import build_chemistry_prompt
from app.repositories.agent_repository import AgentRepository
from app.repositories.chemistry_repository import ChemistryRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository


class ChemistryService:
    def __init__(
        self,
        agent_repository: AgentRepository,
        conversation_repository: ConversationRepository,
        message_repository: MessageRepository,
        chemistry_repository: ChemistryRepository,
    ):
        self.agent_repository = agent_repository
        self.conversation_repository = conversation_repository
        self.message_repository = message_repository
        self.chemistry_repository = chemistry_repository

    async def analyze(self, conversation_id: str) -> ChemistryDTO:
        conv = await self.conversation_repository.get_by_id(conversation_id)
        if conv is None:
            raise ConversationNotFoundException()
        if conv.status != "completed":
            raise ConversationNotCompletedException()

        cached = await self.chemistry_repository.get_by_conversation(conversation_id)
        if cached is not None:
            return cached

        messages = await self.message_repository.list_by_conversation(conversation_id)
        if not messages:
            raise NoMessagesException()

        # 4. Matchmaker Agent 조회
        matchmaker = await self.agent_repository.get_matchmaker()
        if matchmaker is None:
            raise MatchmakerNotFoundException()

        # 5. Prompt 빌드
        prompt = build_chemistry_prompt(messages)

        # 6. Solar LLM 호출 (JSON 응답 강제)
        try:
            raw = await solar_client.chat_completion(
                system_prompt=matchmaker.system_prompt,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024,
                response_format={"type": "json_object"},
            )
        except Exception as e:
            logger.error("Solar API 호출 실패: %s", e)
            raise ChemistryAnalysisFailed()

        # 7. JSON 파싱 및 검증
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as e:
            logger.error("JSON 파싱 실패: %s", e)
            raise ChemistryAnalysisFailed()

        # 필수 필드 검증 (good_points, concerns, metrics 추가)
        required_fields = [
            "score",
            "oneliner",
            "summary",
            "final_comment",
            "good_points",
            "concerns",
            "metrics",
        ]
        for field in required_fields:
            if field not in parsed:
                logger.error("필수 필드 누락: %s", field)
                raise ChemistryAnalysisFailed()

        # score 범위 검증 (0-100)
        # NOTE: score는 숫자 하나라 기본값 대체가 합리적.
        # good_points/metrics는 핵심 결과물이라 없으면 분석 의미 없어서 실패 처리.
        # TODO: 추후 LLM 응답 품질 개선 시 fallback 정책 재검토 필요
        score = parsed.get("score")
        if not isinstance(score, int) or not (0 <= score <= 100):
            logger.warning("잘못된 score 값: %s, fallback to 50", score)
            score = 50

        # good_points 검증 강화 - 비어있으면 실패
        good_points = parsed.get("good_points", [])
        if not isinstance(good_points, list) or len(good_points) == 0:
            logger.error("good_points가 비어있거나 잘못된 타입: %s", good_points)
            raise ChemistryAnalysisFailed()
        good_points = [str(p) for p in good_points if p]
        if len(good_points) == 0:
            logger.error("good_points가 모두 빈 문자열")
            raise ChemistryAnalysisFailed()

        # concerns 검증 - 타입만 확인 (빈 리스트 허용)
        concerns = parsed.get("concerns", [])
        if not isinstance(concerns, list):
            logger.error("concerns가 잘못된 타입: %s", concerns)
            raise ChemistryAnalysisFailed()
        concerns = [str(c) for c in concerns if c]

        # metrics 검증 강화 - 비어있으면 실패
        metrics = parsed.get("metrics", {})
        if not isinstance(metrics, dict) or len(metrics) == 0:
            logger.error("metrics가 비어있거나 잘못된 타입: %s", metrics)
            raise ChemistryAnalysisFailed()
        metrics = {
            k: int(v) for k, v in metrics.items() if isinstance(v, (int, float))
        }
        if len(metrics) == 0:
            logger.error("metrics의 모든 값이 유효하지 않음")
            raise ChemistryAnalysisFailed()

        # 8. ChemistryDTO 생성 및 저장
        dto = ChemistryDTO(
            score=score,
            oneliner=str(parsed.get("oneliner", "")),
            summary=str(parsed.get("summary", "")),
            good_points=good_points,
            concerns=concerns,
            metrics=metrics,
            final_comment=str(parsed.get("final_comment", "")),
        )

        saved_dto = await self.chemistry_repository.create(
            conversation_id=conversation_id,
            dto=dto,
        )

        logger.info(
            "케미 분석 완료: conversation_id=%s, score=%d",
            conversation_id,
            saved_dto.score,
        )
        return saved_dto
