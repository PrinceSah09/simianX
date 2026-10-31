"""FastAPI app — wires routes, logging, and settings together. No logic lives here."""

import logging
import time

from fastapi import FastAPI
from opentelemetry import trace
from starlette.requests import Request
from starlette.responses import Response

from app.api.routes import experiments as experiments_router
from app.api.routes import health as health_router
from app.core.config import settings
from app.core.otel import setup_opentelemetry
from app.core.prometheus import get_prometheus_metrics, record_prometheus_request
from app.core.telemetry import metrics_collector

# Configure logging once at startup.
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="SimianX SRE Reliability & Chaos Engineering Control Plane — telemetry & experiment engine.",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    openapi_url="/openapi.json",
)

# Initialize OpenTelemetry instrumentation
setup_opentelemetry(app)


@app.middleware("http")
async def record_telemetry_middleware(request: Request, call_next) -> Response:
    """Measure request duration and record telemetry for dashboard observability."""
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_s = time.perf_counter() - start_time
    duration_ms = duration_s * 1000

    # Inject active trace ID into response headers for client correlation
    current_span = trace.get_current_span()
    if current_span and current_span.get_span_context().is_valid:
        trace_id = format(current_span.get_span_context().trace_id, "032x")
        response.headers["X-Trace-Id"] = trace_id

    # Don't record internal metrics polling to avoid self-referential loop
    excluded_paths = (
        "/metrics",
        "/api/v1/metrics",
        "/api/v1/metrics/series",
        "/api/v1/traces",
        "/docs",
        "/openapi.json",
    )
    if request.url.path not in excluded_paths:
        metrics_collector.record_request(duration_ms, response.status_code)
        record_prometheus_request(
            request.method,
            request.url.path,
            response.status_code,
            duration_s,
        )

    return response


# Mount routers
app.include_router(health_router.router)
app.include_router(experiments_router.router)


@app.get("/metrics", include_in_schema=False)
def prometheus_metrics() -> Response:
    """Standard Prometheus text scrape endpoint for Kubernetes / Prometheus."""
    content, content_type = get_prometheus_metrics()
    return Response(content=content, media_type=content_type)


logger.info(
    "SimianX API started — version %s | debug=%s",
    settings.app_version,
    settings.debug,
)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    """Welcome redirect — points clients to /docs and /health."""
    return {
        "message": f"Welcome to {settings.app_name} API",
        "docs": "/docs",
        "health": "/health",
    }
