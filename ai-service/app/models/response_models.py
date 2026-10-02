from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class TokenUsage(BaseModel):
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    total_tokens: int = Field(default=0)


class CompletionResponse(BaseModel):
    provider: str = Field(..., description="LLM provider: openai or anthropic")
    model: str = Field(..., description="Model version used")
    content: str = Field(..., description="Generated text completion")
    usage: Optional[TokenUsage] = Field(default=None, description="Token consumption metrics")
    raw_metadata: Optional[Dict[str, Any]] = Field(default=None)


class ChatResponse(BaseModel):
    provider: str
    model: str
    role: str = "assistant"
    content: str
    usage: Optional[TokenUsage] = None


class ChainAnalysisResponse(BaseModel):
    status: str = "completed"
    task: str
    summary: str
    action_items: List[str]
    confidence_score: float = 0.95
    metadata: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "0.1.0"
    service: str = "fastapi-ai-service"
    environment: str
    openai_configured: bool
    anthropic_configured: bool
