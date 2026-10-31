"""App settings — loaded from env vars / .env, validated by Pydantic at startup."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App identity
    app_name: str = "SimianX"
    app_version: str = "0.1.0"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Cluster & Observability
    target_service_url: str = "http://127.0.0.1:8000"
    prometheus_url: str = "http://prometheus:9090"
    pod_name: str = "local-node"

    # OpenTelemetry & Tracing
    otel_enabled: bool = True
    otel_service_name: str = "simianx-backend"
    otlp_endpoint: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Module-level singleton — import this instead of calling Settings() each time.
settings = Settings()
