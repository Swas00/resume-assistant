from fastapi import APIRouter, HTTPException, status

from app.models.job import ParseJobResponse
from app.models.resume import ParseRequest, ParseResponse
from app.services.job_parser import JobParser
from app.services.resume_parser import ResumeParser
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["Resume Parsing"])

MIN_TEXT_LENGTH = 50


# Plain `def` so FastAPI runs the CPU-bound spaCy work in its threadpool
# instead of blocking the event loop.
@router.post(
    "/parse",
    response_model=ParseResponse,
    summary="Parse resume text into structured data",
    status_code=status.HTTP_200_OK,
)
def parse_resume(request: ParseRequest) -> ParseResponse:
    """
    Request:  `text` - raw resume text content.
    Response: `success`, `message`, and `data` (the parsed resume).
    """
    # Validate before the try block so this 400 isn't swallowed into a 500
    if len(request.text.strip()) < MIN_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resume text is too short. Minimum {MIN_TEXT_LENGTH} characters required.",
        )

    logger.info(f"Received parse request. Text length: {len(request.text)}")
    try:
        parsed = ResumeParser.parse(request.text)
    except Exception as e:
        logger.error(f"Parsing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse resume: {e}",
        )

    logger.info(f"Parsing successful. Confidence: {parsed.confidence}")
    return ParseResponse(success=True, message="Resume parsed successfully", data=parsed)


@router.post(
    "/parse-job",
    response_model=ParseJobResponse,
    summary="Parse a job description into structured data",
    status_code=status.HTTP_200_OK,
)
def parse_job(request: ParseRequest) -> ParseJobResponse:
    """Request: `text` - raw job description. Response: `success`, `message`, `data`."""
    # Job posts can be short (a one-line title), so only reject empty input
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text is empty.",
        )

    try:
        parsed = JobParser.parse_job(request.text)
    except Exception as e:
        logger.error(f"Job parsing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse job description: {e}",
        )

    logger.info(f"Job parsed. Confidence: {parsed.confidence_score}")
    return ParseJobResponse(success=True, message="Job parsed successfully", data=parsed)
