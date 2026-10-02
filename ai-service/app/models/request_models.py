from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: MessageRole = Field(default=MessageRole.USER, description="Role of the author")
    content: str = Field(..., min_length=1, description="Message text content")


class CompletionRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="The prompt string to send to the model")
    model: Optional[str] = Field(default=None, description="Optional override for model name")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: int = Field(default=1024, ge=1, le=8192, description="Maximum tokens to generate")
    stream: bool = Field(default=False, description="Whether to stream the response chunks")

    model_config = {
        "json_schema_extra": {
            "example": {
                "prompt": "Explain the architectural advantages of micro-frontends with React 19.",
                "temperature": 0.7,
                "max_tokens": 512,
            }
        }
    }


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, description="List of previous conversation messages")
    model: Optional[str] = Field(default=None, description="Model identifier")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=1, le=8192)

    model_config = {
        "json_schema_extra": {
            "example": {
                "messages": [
                    {"role": "system", "content": "You are a senior full-stack software architect."},
                    {"role": "user", "content": "How do I secure an Express API with JWT and RBAC?"}
                ]
            }
        }
    }


class ChainAnalysisRequest(BaseModel):
    task: str = Field(..., min_length=1, description="The specific analysis task description")
    context: str = Field(..., description="Background context or raw data payload to analyze")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary execution arguments")

    model_config = {
        "json_schema_extra": {
            "example": {
                "task": "Summarize codebase security readiness",
                "context": "Express server includes Helmet, CORS allowlist, and bcrypt salt rounds 10.",
            }
        }
    }
