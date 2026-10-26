"""Route handlers for SRE Experiment Studio and runtime telemetry."""

import time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import settings
from app.core.telemetry import metrics_collector
from app.repositories.experiment import InMemoryExperimentRepository
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentListResponse,
    ExperimentResponse,
    MetricsResponse,
    TimeSeriesResponse,
)
from app.schemas.infrastructure import InfrastructureResponse
from app.services.experiment import ExperimentService
from app.services.prometheus_client import cluster_service

router = APIRouter(prefix="/api/v1", tags=["SRE Experiments & Telemetry"])

# Module-level repository and service singleton for runtime state
_experiment_repo = InMemoryExperimentRepository()
_experiment_service = ExperimentService(
    repo=_experiment_repo,
    collector=metrics_collector,
    base_url=settings.target_service_url,
)


def get_experiment_service() -> ExperimentService:
    return _experiment_service


@router.post(
    "/experiments",
    response_model=ExperimentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new reliability experiment",
)
async def create_experiment(
    payload: ExperimentCreate,
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentResponse:
    """Validate safety parameters and start a non-blocking experiment."""
    try:
        experiment = service.start_experiment(payload)
        return ExperimentResponse.model_validate(experiment)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        ) from e


@router.get(
    "/experiments",
    response_model=ExperimentListResponse,
    summary="List recent experiments",
)
def list_experiments(
    limit: int = Query(20, ge=1, le=100),
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentListResponse:
    """Retrieve history of recently executed experiments."""
    items = service.list_recent(limit=limit)
    return ExperimentListResponse(
        items=[ExperimentResponse.model_validate(item) for item in items],
        total=len(items),
    )


@router.get(
    "/experiments/{experiment_id}",
    response_model=ExperimentResponse,
    summary="Get experiment status and measured results",
)
def get_experiment(
    experiment_id: UUID,
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentResponse:
    """Retrieve status, configuration, and computed metrics for an experiment."""
    experiment = service.get_by_id(experiment_id)
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID '{experiment_id}' not found.",
        )
    return ExperimentResponse.model_validate(experiment)


@router.post(
    "/experiments/{experiment_id}/stop",
    response_model=ExperimentResponse,
    summary="Stop a running experiment",
)
async def stop_experiment(
    experiment_id: UUID,
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentResponse:
    """Cancel experiment workload cleanly. Safe on already stopped runs."""
    experiment = service.stop_experiment(experiment_id)
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID '{experiment_id}' not found.",
        )
    return ExperimentResponse.model_validate(experiment)


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    summary="Live telemetry metrics for dashboard",
)
def get_metrics(
    service: ExperimentService = Depends(get_experiment_service),
) -> MetricsResponse:
    """Expose live throughput, P95 latency, error rates, and request counts.

    If Prometheus is reachable with multi-pod aggregated cluster metrics,
    uses cluster-wide aggregated values (aggregate-then-quantile).
    Otherwise seamlessly falls back to node-local metrics collector.
    """
    cluster_metrics = cluster_service.get_cluster_metrics()
    if cluster_metrics is not None:
        return MetricsResponse.model_validate(cluster_metrics)

    snapshot = service.get_metrics()
    return MetricsResponse.model_validate(snapshot)


@router.get(
    "/infrastructure",
    response_model=InfrastructureResponse,
    summary="Kubernetes cluster infrastructure and Prometheus discovery status",
)
def get_infrastructure(
    namespace: str = Query("simianx", description="Kubernetes namespace"),
) -> InfrastructureResponse:
    """Expose desired/ready replicas, pod list with health and restarts,
    and Prometheus targets.
    """
    return cluster_service.get_infrastructure_state(namespace=namespace)


@router.post(
    "/infrastructure/scale",
    response_model=InfrastructureResponse,
    summary="Manually scale backend deployment replicas",
)
def scale_infrastructure(
    replicas: int = Query(..., ge=1, le=20, description="Target replica count (1-20)"),
    namespace: str = Query("simianx", description="Kubernetes namespace"),
) -> InfrastructureResponse:
    """Trigger manual deployment scale and return updated cluster state."""
    scaled = cluster_service.scale_deployment(replicas=replicas, namespace=namespace)
    if not scaled and cluster_service.is_prometheus_reachable():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to scale Kubernetes deployment.",
        )
    return cluster_service.get_infrastructure_state(namespace=namespace)


@router.get(
    "/metrics/series",
    response_model=TimeSeriesResponse,
    summary="Live time-series telemetry buckets (real measurements)",
)
def get_metrics_series(
    window_seconds: int = Query(60, ge=10, le=300),
    bucket_seconds: int = Query(1, ge=1, le=10),
    service: ExperimentService = Depends(get_experiment_service),
) -> TimeSeriesResponse:
    """Return real timestamped buckets for throughput, latency,
    and error rate charts.

    When running in Kubernetes with Prometheus, fetches cluster-wide
    aggregated time series across all pods. Otherwise falls back to
    node-local in-memory time series.
    """
    cluster_points = cluster_service.get_cluster_time_series(
        window_seconds=window_seconds,
        bucket_seconds=bucket_seconds,
    )
    if cluster_points is not None and len(cluster_points) > 0:
        return TimeSeriesResponse(
            points=cluster_points,
            window_seconds=window_seconds,
            bucket_seconds=bucket_seconds,
        )

    points = service.get_time_series(
        window_seconds=window_seconds,
        bucket_seconds=bucket_seconds,
    )
    return TimeSeriesResponse(
        points=points,
        window_seconds=window_seconds,
        bucket_seconds=bucket_seconds,
    )


@router.get(
    "/test-target",
    summary="Predefined local target for controlled experiment workloads",
)
def test_target() -> dict[str, str | float]:
    """Lightweight test workload endpoint that records request telemetry."""
    now = time.time()
    return {
        "status": "ok",
        "service": "SimianX Test Service",
        "timestamp": now,
    }


@router.get(
    "/fail",
    summary="Simulated error endpoint for testing error rate telemetry and alerting",
)
def trigger_fail(
    status_code: int = Query(
        500, description="HTTP status code to trigger (e.g. 500, 503, 400, 404)"
    ),
) -> None:
    """Forces an HTTP error response to test dashboard error telemetry and alerting."""
    raise HTTPException(
        status_code=status_code,
        detail=f"Simulated error: HTTP {status_code}",
    )
