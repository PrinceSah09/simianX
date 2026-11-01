"""Dedicated API router for live granular request logs and telemetry activity stream."""

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.routes.experiments import get_experiment_service
from app.services.experiment import ExperimentService

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get(
    "",
    summary="Get recent granular request logs",
    description="Retrieve granular real-time request logs for each individual HTTP call with optional filtering.",
)
def get_live_logs(
    limit: int = Query(200, ge=1, le=1000, description="Max logs to return"),
    level: str | None = Query(None, description="Filter by log level: INFO, WARN, ERROR"),
    status_code: int | None = Query(None, description="Filter by HTTP status code (e.g. 200, 500)"),
    min_duration_ms: float | None = Query(None, description="Filter by minimum duration in milliseconds"),
    search: str | None = Query(None, description="Search text in endpoint, trace ID, or message"),
    service: ExperimentService = Depends(get_experiment_service),
) -> dict[str, Any]:
    """Retrieve granular real-time request logs for each individual HTTP call."""
    items = service.get_recent_logs(
        limit=limit,
        level=level,
        status_code=status_code,
        min_duration_ms=min_duration_ms,
        search=search,
    )
    return {
        "items": items,
        "total": len(items),
        "limit": limit,
    }


@router.delete(
    "",
    summary="Clear live request logs",
    description="Clear all stored request logs in the telemetry buffer.",
)
def clear_live_logs(
    service: ExperimentService = Depends(get_experiment_service),
) -> dict[str, str]:
    """Clear all stored request logs."""
    service.clear_logs()
    return {"status": "cleared"}

