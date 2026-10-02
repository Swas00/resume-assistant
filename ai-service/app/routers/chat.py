from fastapi import APIRouter, HTTPException, Query, status
from app.models.request_models import ChatRequest
from app.models.response_models import ChatResponse
from app.services.openai_service import openai_service
from app.services.claude_service import claude_service
from app.utils.logger import logger

router = APIRouter(prefix="/chat", tags=["Chat Conversations"])


@router.post(
    "/completions",
    response_model=ChatResponse,
    summary="Multi-turn chat completion",
    status_code=status.HTTP_200_OK,
)
async def chat_completion(
    request: ChatRequest,
    provider: str = Query(
        default="openai",
        regex="^(openai|claude)$",
        description="Select AI backend provider: 'openai' or 'claude'",
    ),
):
    """
    Execute a chat completion supporting OpenAI or Claude multi-turn conversations.
    """
    try:
        if provider == "claude":
            return await claude_service.generate_chat(
                messages=request.messages,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )
        else:
            return await openai_service.generate_chat(
                messages=request.messages,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )
    except Exception as e:
        logger.error(f"Chat completion error with provider '{provider}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat generation failed: {str(e)}",
        )
