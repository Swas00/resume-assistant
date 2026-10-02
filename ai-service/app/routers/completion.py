from fastapi import APIRouter, HTTPException, status
from app.models.request_models import CompletionRequest
from app.models.response_models import CompletionResponse
from app.services.openai_service import openai_service
from app.services.claude_service import claude_service
from app.utils.logger import logger

router = APIRouter(prefix="/completion", tags=["Completions"])


@router.post(
    "/openai",
    response_model=CompletionResponse,
    summary="Generate completion using OpenAI",
    status_code=status.HTTP_200_OK,
)
async def openai_completion(request: CompletionRequest):
    """
    Dispatch a completion request to OpenAI (or fallback simulator).
    """
    try:
        return await openai_service.generate_completion(request)
    except Exception as e:
        logger.error(f"Endpoint /completion/openai failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OpenAI service execution error: {str(e)}",
        )


@router.post(
    "/claude",
    response_model=CompletionResponse,
    summary="Generate completion using Anthropic Claude",
    status_code=status.HTTP_200_OK,
)
async def claude_completion(request: CompletionRequest):
    """
    Dispatch a completion request to Claude (or fallback simulator).
    """
    try:
        return await claude_service.generate_completion(request)
    except Exception as e:
        logger.error(f"Endpoint /completion/claude failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Claude service execution error: {str(e)}",
        )
