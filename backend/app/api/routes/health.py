"""Route handler for GET /health — no business logic, just HTTP in/out."""

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    tags=["Infrastructure"],
)
def get_health() -> HealthResponse:
    """Returns service status. Use for load balancers and monitoring probes."""
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
    )
