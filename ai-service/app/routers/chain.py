from fastapi import APIRouter, HTTPException, status
from app.models.request_models import ChainAnalysisRequest
from app.models.response_models import ChainAnalysisResponse
from app.services.langchain_service import langchain_service
from app.utils.logger import logger

router = APIRouter(prefix="/chain", tags=["LangChain Orchestration"])


@router.post(
    "/analyze",
    response_model=ChainAnalysisResponse,
    summary="Execute LangChain structured evaluation chain",
    status_code=status.HTTP_200_OK,
)
async def analyze_task(request: ChainAnalysisRequest):
    """
    Run an orchestrated LangChain analysis sequence over the given task and context.
    """
    try:
        return await langchain_service.run_analysis_chain(request)
    except Exception as e:
        logger.error(f"LangChain orchestration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangChain chain execution error: {str(e)}",
        )
