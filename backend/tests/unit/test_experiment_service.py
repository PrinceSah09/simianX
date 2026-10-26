"""Unit tests for ExperimentService — lifecycle, validation, and calculations."""

from uuid import uuid4

import pytest

from app.core.telemetry import MetricsCollector
from app.models.experiment import Experiment
from app.repositories.experiment import InMemoryExperimentRepository
from app.schemas.experiment import ExperimentCreate
from app.services.experiment import ExperimentService


@pytest.fixture
def repo() -> InMemoryExperimentRepository:
    return InMemoryExperimentRepository()


@pytest.fixture
def collector() -> MetricsCollector:
    return MetricsCollector()


@pytest.fixture
def service(
    repo: InMemoryExperimentRepository, collector: MetricsCollector
) -> ExperimentService:
    return ExperimentService(repo=repo, collector=collector)


def test_start_experiment_creates_running_experiment(
    service: ExperimentService,
) -> None:
    data = ExperimentCreate(
        scenario="traffic_burst", duration_seconds=10, intensity="low"
    )
    exp = service.start_experiment(data)

    assert exp.id is not None
    assert exp.status == "running"
    assert exp.duration_seconds == 10
    assert exp.intensity == "low"
    assert exp.started_at is not None

    # Clean up background task
    service.stop_experiment(exp.id)


def test_start_experiment_rejects_concurrent_experiment(
    service: ExperimentService,
) -> None:
    data = ExperimentCreate(
        scenario="traffic_burst", duration_seconds=15, intensity="low"
    )
    exp1 = service.start_experiment(data)

    with pytest.raises(ValueError, match="already in progress"):
        service.start_experiment(data)

    # Clean up
    service.stop_experiment(exp1.id)


def test_stop_experiment_marks_as_stopped(service: ExperimentService) -> None:
    data = ExperimentCreate(
        scenario="traffic_burst", duration_seconds=20, intensity="low"
    )
    exp = service.start_experiment(data)
    assert exp.status == "running"

    stopped = service.stop_experiment(exp.id)
    assert stopped is not None
    assert stopped.status == "stopped"
    assert stopped.ended_at is not None


def test_stop_experiment_is_idempotent(service: ExperimentService) -> None:
    data = ExperimentCreate(
        scenario="traffic_burst", duration_seconds=20, intensity="low"
    )
    exp = service.start_experiment(data)
    service.stop_experiment(exp.id)

    # Calling stop again should not crash or error
    stopped_again = service.stop_experiment(exp.id)
    assert stopped_again is not None
    assert stopped_again.status == "stopped"


def test_stop_unknown_experiment_returns_none(service: ExperimentService) -> None:
    assert service.stop_experiment(uuid4()) is None


def test_compute_results_calculates_correct_quantiles(
    service: ExperimentService, repo: InMemoryExperimentRepository
) -> None:
    exp = Experiment(
        scenario="traffic_burst",
        duration_seconds=10,
        intensity="low",
        target_endpoint="/api/v1/test-target",
    )
    repo.save(exp)

    # Feed 10 synthetic samples: latencies 10ms..100ms with 2 errors (500)
    samples = [
        (10.0, 200),
        (20.0, 200),
        (30.0, 200),
        (40.0, 200),
        (50.0, 200),
        (60.0, 200),
        (70.0, 200),
        (80.0, 200),
        (90.0, 500),
        (100.0, 500),
    ]
    service._compute_results(exp, samples, actual_duration=2.0)

    res = exp.results
    assert res.total_requests == 10
    assert res.successful_requests == 8
    assert res.failed_requests == 2
    assert res.error_rate == 20.0
    assert res.achieved_rps == 5.0
    assert res.p50_latency_ms == 50.0
    assert res.p90_latency_ms == 90.0
    assert res.p95_latency_ms == 100.0
    assert res.status_codes == {"200": 8, "500": 2}
