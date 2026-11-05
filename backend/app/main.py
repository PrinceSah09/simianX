"""FastAPI app — wires routes, logging, and settings together. No logic lives here."""

import asyncio
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from opentelemetry import trace
from starlette.requests import Request
from starlette.responses import Response

from app.api.routes import alerts as alerts_router
from app.api.routes import experiments as experiments_router
from app.api.routes import health as health_router
from app.api.routes import logs as logs_router
from app.api.routes.experiments import get_experiment_service
from app.core.config import settings
from app.core.otel import setup_opentelemetry
from app.core.prometheus import get_prometheus_metrics, record_prometheus_request
from app.core.telemetry import metrics_collector
from app.services.slack_alerter import slack_alerter

# Configure logging once at startup.
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Background lifecycle task for continuous Slack incident evaluation."""
    stop_event = asyncio.Event()

    async def alert_monitor_loop():
        logger.info("SimianX Slack Alert Monitor loop started.")
        while not stop_event.is_set():
            try:
                snapshot = metrics_collector.get_snapshot()
                active_exp = get_experiment_service().get_active_run_snapshot()
                active_scenario = active_exp.get("scenario") if active_exp else None
                await slack_alerter.evaluate_telemetry(snapshot, active_scenario=active_scenario)
            except Exception as e:
                logger.debug("Slack alert evaluation cycle: %s", e)

            try:
                await asyncio.wait_for(stop_event.wait(), timeout=3.0)
            except TimeoutError:
                pass

    monitor_task = asyncio.create_task(alert_monitor_loop())
    yield
    stop_event.set()
    monitor_task.cancel()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="SimianX SRE Reliability & Chaos Engineering Control Plane — telemetry & experiment engine.",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    openapi_url="/openapi.json",
    lifespan=lifespan,
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

    # Don't record internal control-plane admin/polling endpoints to avoid telemetry pollution
    admin_prefixes = (
        "/metrics",
        "/health",
        "/api/v1/metrics",
        "/api/v1/traces",
        "/api/v1/logs",
        "/api/v1/infrastructure",
        "/api/v1/experiments",
        "/api/v1/chaos",
        "/api/v1/alerts",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
    )
    is_admin = request.url.path == "/" or any(
        request.url.path.startswith(prefix) for prefix in admin_prefixes
    )

    if not is_admin:
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
app.include_router(logs_router.router, prefix="/api/v1")
app.include_router(alerts_router.router, prefix="/api/v1")


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
