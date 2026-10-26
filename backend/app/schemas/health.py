"""Pydantic response schema for GET /health."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """JSON body returned by GET /health."""

    status: str  # "ok" when healthy; future: "degraded" / "unhealthy"
    service: str  # service name — useful in shared observability stacks
    version: str  # deployed version, aids debugging across environments
