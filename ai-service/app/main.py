from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.response_models import HealthResponse
from app.routers import completion_router, chat_router, chain_router, parse_router
from app.services.openai_service import openai_service
from app.services.claude_service import claude_service
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup operations
    logger.info("Initializing Antigravity AI Microservice...")
    logger.info(f"Loaded environment: {settings.environment}")
    logger.info(f"OpenAI service configured: {openai_service.is_available}")
    logger.info(f"Claude service configured: {claude_service.is_available}")
    yield
    # Shutdown operations
    logger.info("Shutting down Antigravity AI Microservice cleanly.")


app = FastAPI(
    title="Antigravity AI Service",
    description="High-performance FastAPI service integrating OpenAI, Claude, and LangChain orchestration.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    logger.error(f"Global unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal AI Service Error", "error": str(exc)},
    )


# Health check endpoint
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Microservice health and provider status",
)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        service="fastapi-ai-service",
        environment=settings.environment,
        openai_configured=openai_service.is_available,
        anthropic_configured=claude_service.is_available,
    )


# Root information endpoint
@app.get("/", tags=["System"], summary="Service greeting")
async def root():
    return {
        "service": "Antigravity AI Service",
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "openai_completion": "/completion/openai",
            "claude_completion": "/completion/claude",
            "chat": "/chat/completions",
            "chain_analyze": "/chain/analyze",
            "parse_resume": "/api/parse",
            "parse_job": "/api/parse-job",
        },
    }


# Mount API routers
app.include_router(completion_router)
app.include_router(chat_router)
app.include_router(chain_router)
app.include_router(parse_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
