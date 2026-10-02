from typing import Optional, List
from anthropic import AsyncAnthropic
from app.config import settings
from app.models.request_models import CompletionRequest, ChatMessage
from app.models.response_models import CompletionResponse, ChatResponse, TokenUsage
from app.utils.logger import logger


class ClaudeService:
    def __init__(self):
        self._client: Optional[AsyncAnthropic] = None
        if settings.anthropic_api_key:
            self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
            logger.info("Anthropic Claude client initialized successfully.")
        else:
            logger.warn("ANTHROPIC_API_KEY not configured. Running in mock/fallback mode.")

    @property
    def is_available(self) -> bool:
        return self._client is not None

    async def generate_completion(self, request: CompletionRequest) -> CompletionResponse:
        model = request.model or settings.anthropic_default_model

        if not self._client:
            logger.info(f"Simulating Claude completion for model: {model}")
            return CompletionResponse(
                provider="anthropic (simulated)",
                model=model,
                content=f"[Simulated Claude Completion]: Received prompt: '{request.prompt}'. To enable live Claude inferences, set ANTHROPIC_API_KEY in .env.",
                usage=TokenUsage(prompt_tokens=25, completion_tokens=35, total_tokens=60),
            )

        try:
            response = await self._client.messages.create(
                model=model,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                messages=[{"role": "user", "content": request.prompt}],
            )
            # Claude returns content blocks
            text_content = ""
            for block in response.content:
                if hasattr(block, "text"):
                    text_content += block.text

            return CompletionResponse(
                provider="anthropic",
                model=model,
                content=text_content,
                usage=TokenUsage(
                    prompt_tokens=response.usage.input_tokens,
                    completion_tokens=response.usage.output_tokens,
                    total_tokens=response.usage.input_tokens + response.usage.output_tokens,
                ),
            )
        except Exception as e:
            logger.error(f"Claude completion error: {e}")
            raise

    async def generate_chat(
        self, messages: List[ChatMessage], model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 2048
    ) -> ChatResponse:
        target_model = model or settings.anthropic_default_model

        if not self._client:
            return ChatResponse(
                provider="anthropic (simulated)",
                model=target_model,
                role="assistant",
                content=f"[Simulated Claude Chat]: Answered based on {len(messages)} context messages.",
                usage=TokenUsage(prompt_tokens=30, completion_tokens=25, total_tokens=55),
            )

        try:
            # Separate system prompt if present
            system_prompt = ""
            anthropic_messages = []
            for m in messages:
                if m.role.value == "system":
                    system_prompt += f"{m.content}\n"
                else:
                    anthropic_messages.append({"role": m.role.value, "content": m.content})

            kwargs = {
                "model": target_model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": anthropic_messages,
            }
            if system_prompt:
                kwargs["system"] = system_prompt.strip()

            response = await self._client.messages.create(**kwargs)  # type: ignore

            text_content = "".join([b.text for b in response.content if hasattr(b, "text")])

            return ChatResponse(
                provider="anthropic",
                model=target_model,
                role="assistant",
                content=text_content,
                usage=TokenUsage(
                    prompt_tokens=response.usage.input_tokens,
                    completion_tokens=response.usage.output_tokens,
                    total_tokens=response.usage.input_tokens + response.usage.output_tokens,
                ),
            )
        except Exception as e:
            logger.error(f"Claude chat error: {e}")
            raise


claude_service = ClaudeService()
