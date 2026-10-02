from typing import List, Union
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Server Settings
    environment: str = Field(default="development", description="Environment stage")
    # AI_SERVICE_HOST / AI_SERVICE_PORT take priority; HOST / PORT remain supported
    host: str = Field(
        default="0.0.0.0",
        validation_alias=AliasChoices("ai_service_host", "host"),
        description="Host to bind to",
    )
    port: int = Field(
        default=8000,
        validation_alias=AliasChoices("ai_service_port", "port"),
        description="Port to listen on",
    )
    backend_url: str = Field(default="http://localhost:5000", description="Node backend base URL")
    debug: bool = Field(default=True, description="Debug mode flag")
    cors_origins: Union[List[str], str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://localhost:5000", "*"],
        description="Allowed CORS origins",
    )

    # OpenAI Settings
    openai_api_key: str = Field(default="", description="OpenAI API Key")
    openai_default_model: str = Field(default="gpt-4o", description="Default OpenAI model")

    # Anthropic Settings
    anthropic_api_key: str = Field(default="", description="Anthropic API Key")
    anthropic_default_model: str = Field(
        default="claude-3-5-sonnet-20241022", description="Default Anthropic model"
    )

    # LangChain Settings
    langchain_tracing_v2: bool = Field(default=False)
    langchain_api_key: str = Field(default="")
    langchain_project: str = Field(default="antigravity-ai-service")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def parsed_cors_origins(self) -> List[str]:
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return self.cors_origins


settings = Settings()
