"""Domain model for SRE experiments and reliability telemetry."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4


@dataclass
class ExperimentResult:
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    achieved_rps: float = 0.0
    p50_latency_ms: float = 0.0
    p90_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    error_rate: float = 0.0
    status_codes: dict[str, int] = field(default_factory=dict)
    duration_seconds: float = 0.0


@dataclass
class Experiment:
    scenario: str
    duration_seconds: int
    intensity: str
    target_endpoint: str
    id: UUID = field(default_factory=uuid4)
    status: str = "queued"  # queued | running | completed | stopped | failed
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    started_at: datetime | None = None
    ended_at: datetime | None = None
    results: ExperimentResult = field(default_factory=ExperimentResult)
    error_message: str | None = None
