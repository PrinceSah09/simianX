"""Pydantic schemas for SRE experiments and metrics."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ExperimentCreate(BaseModel):
    scenario: Literal["traffic_burst"] = Field(
        default="traffic_burst",
        description="Reliability experiment scenario.",
    )
    duration_seconds: int = Field(
        default=10,
        ge=10,
        le=30,
        description="Duration of the experiment in seconds (10 to 30s).",
    )
    intensity: Literal["low", "moderate", "high"] = Field(
        default="low",
        description="Target intensity: low (10 rps), moderate (25 rps), high (50 rps).",
    )


class ExperimentResultSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_requests: int
    successful_requests: int
    failed_requests: int
    achieved_rps: float
    p50_latency_ms: float
    p90_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    error_rate: float
    status_codes: dict[str, int]
    duration_seconds: float


class ExperimentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scenario: str
    duration_seconds: int
    intensity: str
    target_endpoint: str
    status: str
    created_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
    results: ExperimentResultSchema
    error_message: str | None


class ExperimentListResponse(BaseModel):
    items: list[ExperimentResponse]
    total: int


class MetricsResponse(BaseModel):
    """Real collected runtime metrics from the test service and experiments."""

    total_requests: int
    requests_per_second: float
    p50_latency_ms: float
    p90_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    error_count: int
    error_rate: float
    status_codes: dict[str, int]
    service_status: str
    uptime_seconds: float
    timestamp: float = 0.0
    window_requests: int = 0
    window_errors: int = 0
    window_error_rate: float = 0.0
    window_duration_seconds: float = 10.0


class TimeSeriesPoint(BaseModel):
    timestamp: float
    iso_time: str
    requests: int
    rps: float
    p50_latency_ms: float | None = None
    p95_latency_ms: float | None = None
    p99_latency_ms: float | None = None
    error_count: int
    error_rate: float


class TimeSeriesResponse(BaseModel):
    points: list[TimeSeriesPoint]
    window_seconds: int
    bucket_seconds: int
