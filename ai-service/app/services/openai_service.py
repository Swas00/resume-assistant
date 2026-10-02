from typing import Optional, List
from openai import AsyncOpenAI
from app.config import settings
from app.models.request_models import CompletionRequest, ChatMessage
from app.models.response_models import CompletionResponse, ChatResponse, TokenUsage
from app.utils.logger import logger


class OpenAIService:
    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None
        if settings.openai_api_key:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
            logger.info("OpenAI client initialized successfully.")
        else:
            logger.warn("OPENAI_API_KEY not configured. Running in mock/fallback mode.")

    @property
    def is_available(self) -> bool:
        return self._client is not None

    async def generate_completion(self, request: CompletionRequest) -> CompletionResponse:
        model = request.model or settings.openai_default_model

        if not self._client:
            logger.info(f"Simulating OpenAI completion for model: {model}")
            return CompletionResponse(
                provider="openai (simulated)",
                model=model,
                content=f"[Simulated OpenAI Completion]: Processed prompt: '{request.prompt}'. To enable live responses, set OPENAI_API_KEY in .env.",
                usage=TokenUsage(prompt_tokens=20, completion_tokens=30, total_tokens=50),
            )

        try:
            response = await self._client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": request.prompt}],
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )
            choice = response.choices[0]
            usage = response.usage
            return CompletionResponse(
                provider="openai",
                model=model,
                content=choice.message.content or "",
                usage=TokenUsage(
                    prompt_tokens=usage.prompt_tokens if usage else 0,
                    completion_tokens=usage.completion_tokens if usage else 0,
                    total_tokens=usage.total_tokens if usage else 0,
                ) if usage else None,
            )
        except Exception as e:
            logger.error(f"OpenAI completion error: {e}")
            raise

    async def generate_chat(
        self, messages: List[ChatMessage], model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 2048
    ) -> ChatResponse:
        target_model = model or settings.openai_default_model

        if not self._client:
            return ChatResponse(
                provider="openai (simulated)",
                model=target_model,
                role="assistant",
                content=f"[Simulated Chat Response]: Acknowledged conversation containing {len(messages)} messages.",
                usage=TokenUsage(prompt_tokens=30, completion_tokens=20, total_tokens=50),
            )

        try:
            formatted_messages = [{"role": m.role.value, "content": m.content} for m in messages]
            response = await self._client.chat.completions.create(
                model=target_model,
                messages=formatted_messages,  # type: ignore
                temperature=temperature,
                max_tokens=max_tokens,
            )
            choice = response.choices[0]
            usage = response.usage
            return ChatResponse(
                provider="openai",
                model=target_model,
                role="assistant",
                content=choice.message.content or "",
                usage=TokenUsage(
                    prompt_tokens=usage.prompt_tokens if usage else 0,
                    completion_tokens=usage.completion_tokens if usage else 0,
                    total_tokens=usage.total_tokens if usage else 0,
                ) if usage else None,
            )
        except Exception as e:
            logger.error(f"OpenAI chat error: {e}")
            raise


openai_service = OpenAIService()
