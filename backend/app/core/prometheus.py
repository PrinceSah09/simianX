"""Prometheus metrics registry and definitions for SimianX."""

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    REGISTRY,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)

# Counter: Tracks total incoming HTTP requests by method, path, and status code
HTTP_REQUESTS_TOTAL = Counter(
    "simianx_http_requests_total",
    "Total count of HTTP requests processed by SimianX.",
    ["method", "endpoint", "status_code"],
    registry=REGISTRY,
)

# Histogram: Tracks request duration in seconds with calibrated buckets
# from 1ms up to 5s to allow accurate P50, P90, P95, and P99 PromQL calculation.
LATENCY_BUCKETS = (
    0.001,  # 1ms
    0.003,  # 3ms
    0.005,  # 5ms
    0.010,  # 10ms
    0.025,  # 25ms
    0.050,  # 50ms (SLO target)
    0.075,  # 75ms
    0.100,  # 100ms
    0.250,  # 250ms
    0.500,  # 500ms
    1.000,  # 1s
    2.500,  # 2.5s
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "simianx_http_request_duration_seconds",
    "HTTP request duration in seconds.",
    ["method", "endpoint"],
    buckets=LATENCY_BUCKETS,
    registry=REGISTRY,
)

# Gauge: Tracks currently in-flight requests
HTTP_REQUESTS_IN_PROGRESS = Gauge(
    "simianx_http_requests_in_progress",
    "Current in-flight HTTP requests.",
    ["method", "endpoint"],
    registry=REGISTRY,
)

# Gauges: Root filesystem / ephemeral disk capacity & usage
DISK_TOTAL_BYTES = Gauge(
    "simianx_disk_total_bytes",
    "Total ephemeral / container root filesystem capacity in bytes.",
    registry=REGISTRY,
)
DISK_USED_BYTES = Gauge(
    "simianx_disk_used_bytes",
    "Used ephemeral / container root filesystem storage in bytes.",
    registry=REGISTRY,
)
DISK_FREE_BYTES = Gauge(
    "simianx_disk_free_bytes",
    "Free ephemeral / container root filesystem storage in bytes.",
    registry=REGISTRY,
)
DISK_USAGE_PERCENT = Gauge(
    "simianx_disk_usage_percent",
    "Percentage of root filesystem used.",
    registry=REGISTRY,
)


def update_system_storage_metrics() -> None:
    """Sample container root filesystem usage and update Prometheus gauges."""
    import shutil

    try:
        total, used, free = shutil.disk_usage("/")
        DISK_TOTAL_BYTES.set(total)
        DISK_USED_BYTES.set(used)
        DISK_FREE_BYTES.set(free)
        pct = (used / total * 100.0) if total > 0 else 0.0
        DISK_USAGE_PERCENT.set(round(pct, 2))
    except Exception:
        pass


def record_prometheus_request(
    method: str,
    endpoint: str,
    status_code: int,
    duration_seconds: float,
) -> None:
    """Record request observation into Prometheus counters and histograms."""
    # Normalize path to prevent high-cardinality label explosions
    clean_path = endpoint
    if (
        endpoint.startswith("/api/v1/experiments/")
        and endpoint != "/api/v1/experiments"
    ):
        if endpoint.endswith("/stop"):
            clean_path = "/api/v1/experiments/{id}/stop"
        else:
            clean_path = "/api/v1/experiments/{id}"

    HTTP_REQUESTS_TOTAL.labels(
        method=method,
        endpoint=clean_path,
        status_code=str(status_code),
    ).inc()

    HTTP_REQUEST_DURATION_SECONDS.labels(
        method=method,
        endpoint=clean_path,
    ).observe(duration_seconds)


def get_prometheus_metrics() -> tuple[bytes, str]:
    """Generate Prometheus scrape text payload."""
    update_system_storage_metrics()
    return generate_latest(REGISTRY), CONTENT_TYPE_LATEST
