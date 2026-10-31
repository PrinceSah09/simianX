"""OpenTelemetry initialization, tracing provider, and in-memory trace buffer.

Provides distributed tracing instrumentation for FastAPI, HTTPX, and internal
experiment workflows, with export to Grafana Alloy / Tempo and in-memory trace
retrieval for the SimianX frontend waterfall viewer.
"""

import logging
from collections import deque
from collections.abc import Sequence
from datetime import UTC, datetime
from threading import Lock
from typing import Any

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import ReadableSpan, TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    SimpleSpanProcessor,
    SpanExporter,
    SpanExportResult,
)

from app.core.config import settings

logger = logging.getLogger(__name__)


class StoredSpan:
    """Serializable span representation for API responses and waterfall charts."""

    def __init__(
        self,
        span_id: str,
        trace_id: str,
        name: str,
        parent_id: str | None,
        start_time_iso: str,
        end_time_iso: str,
        duration_ms: float,
        status: str,
        attributes: dict[str, Any],
    ) -> None:
        self.span_id = span_id
        self.trace_id = trace_id
        self.name = name
        self.parent_id = parent_id
        self.start_time_iso = start_time_iso
        self.end_time_iso = end_time_iso
        self.duration_ms = duration_ms
        self.status = status
        self.attributes = attributes

    def to_dict(self) -> dict[str, Any]:
        return {
            "span_id": self.span_id,
            "trace_id": self.trace_id,
            "name": self.name,
            "parent_id": self.parent_id,
            "start_time": self.start_time_iso,
            "end_time": self.end_time_iso,
            "duration_ms": self.duration_ms,
            "status": self.status,
            "attributes": self.attributes,
        }


class InMemoryTraceBuffer:
    """Thread-safe ring buffer for completed traces and spans."""

    def __init__(self, max_traces: int = 150) -> None:
        self._max_traces = max_traces
        self._lock = Lock()
        # trace_id -> list of StoredSpan
        self._traces: dict[str, list[StoredSpan]] = {}
        # Order of trace IDs
        self._trace_order: deque[str] = deque(maxlen=max_traces)

    def add_span(self, span: ReadableSpan) -> None:
        trace_id = format(span.context.trace_id, "032x")
        span_id = format(span.context.span_id, "016x")
        parent_id = format(span.parent.span_id, "016x") if span.parent else None

        # Calculate duration in ms
        start_ns = span.start_time or 0
        end_ns = span.end_time or start_ns
        duration_ms = round((end_ns - start_ns) / 1_000_000, 2)

        start_dt = datetime.fromtimestamp(start_ns / 1_000_000_000, tz=UTC)
        end_dt = datetime.fromtimestamp(end_ns / 1_000_000_000, tz=UTC)

        status_str = "OK"
        if span.status.status_code == trace.StatusCode.ERROR:
            status_str = f"ERROR: {span.status.description or 'Unset'}"

        # Clean attributes: filter sensitive keys, convert non-primitives to str
        attributes: dict[str, Any] = {}
        if span.attributes:
            for k, v in span.attributes.items():
                if isinstance(v, (str, int, float, bool)):
                    attributes[k] = v
                else:
                    attributes[k] = str(v)

        stored = StoredSpan(
            span_id=span_id,
            trace_id=trace_id,
            name=span.name,
            parent_id=parent_id,
            start_time_iso=start_dt.isoformat(),
            end_time_iso=end_dt.isoformat(),
            duration_ms=duration_ms,
            status=status_str,
            attributes=attributes,
        )

        with self._lock:
            if trace_id not in self._traces:
                if len(self._trace_order) >= self._max_traces:
                    oldest = self._trace_order.popleft()
                    self._traces.pop(oldest, None)
                self._trace_order.append(trace_id)
                self._traces[trace_id] = []

            self._traces[trace_id].append(stored)

    def get_traces_summary(self, limit: int = 30) -> list[dict[str, Any]]:
        """Return summary of recent traces ordered latest first."""
        with self._lock:
            trace_ids = list(self._trace_order)[-limit:]
            trace_ids.reverse()

            summaries = []
            for tid in trace_ids:
                spans = self._traces.get(tid, [])
                if not spans:
                    continue

                # Root span has no parent or earliest start
                root = next((s for s in spans if s.parent_id is None), spans[0])
                total_duration_ms = max((s.duration_ms for s in spans), default=0.0)
                has_error = any("ERROR" in s.status for s in spans)
                root_http_status = root.attributes.get("http.status_code") or root.attributes.get("http.response.status_code")

                summaries.append({
                    "trace_id": tid,
                    "root_name": root.name,
                    "span_count": len(spans),
                    "start_time": root.start_time_iso,
                    "duration_ms": total_duration_ms,
                    "status": "ERROR" if has_error else "OK",
                    "status_code": root_http_status or (500 if has_error else 200),
                    "scenario": root.attributes.get("simianx.scenario", "standard"),
                })
            return summaries

    def get_trace_detail(self, trace_id: str) -> dict[str, Any] | None:
        """Return full span list and metadata for a specific trace waterfall."""
        with self._lock:
            spans = self._traces.get(trace_id)
            if not spans:
                return None

            root = next((s for s in spans if s.parent_id is None), spans[0])
            total_duration_ms = max((s.duration_ms for s in spans), default=0.0)
            has_error = any("ERROR" in s.status for s in spans)

            return {
                "trace_id": trace_id,
                "root_name": root.name,
                "start_time": root.start_time_iso,
                "duration_ms": total_duration_ms,
                "status": "ERROR" if has_error else "OK",
                "spans": [s.to_dict() for s in spans],
            }


class BufferSpanExporter(SpanExporter):
    """Pass-through span exporter that stores finished spans in the in-memory buffer."""

    def __init__(self, buffer: InMemoryTraceBuffer) -> None:
        self._buffer = buffer

    def export(self, spans: Sequence[ReadableSpan]) -> SpanExportResult:
        for span in spans:
            self._buffer.add_span(span)
        return SpanExportResult.SUCCESS

    def shutdown(self) -> None:
        pass

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True


# Global trace buffer singleton
trace_buffer = InMemoryTraceBuffer(max_traces=200)
_tracer_provider: TracerProvider | None = None


def setup_opentelemetry(app: FastAPI) -> TracerProvider:
    """Configure OTel TracerProvider, auto-instrumentation, and in-memory buffer."""
    global _tracer_provider

    resource = Resource.create({
        "service.name": settings.otel_service_name,
        "service.version": settings.app_version,
        "deployment.environment": "production" if not settings.debug else "development",
        "k8s.pod.name": settings.pod_name,
    })

    provider = TracerProvider(resource=resource)
    # 1. Attach in-memory exporter for dashboard waterfall
    provider.add_span_processor(SimpleSpanProcessor(BufferSpanExporter(trace_buffer)))

    # 2. Attach OTLP HTTP exporter if configured (attempts export, fails silently if Alloy not active)
    if settings.otlp_endpoint:
        try:
            otlp_exporter = OTLPSpanExporter(endpoint=settings.otlp_endpoint, timeout=2)
            provider.add_span_processor(BatchSpanProcessor(otlp_exporter, max_queue_size=2048))
            logger.info("OTLP Trace Exporter initialized pointing to %s", settings.otlp_endpoint)
        except Exception as e:
            logger.warning("Could not initialize OTLP exporter (%s), continuing with in-memory buffer.", e)

    trace.set_tracer_provider(provider)
    _tracer_provider = provider

    # 3. Auto-instrument FastAPI routes (excluding internal scraping/health endpoints)
    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=provider,
        excluded_urls="/health,/metrics,/api/v1/metrics,/api/v1/metrics/series,/docs,/openapi.json",
    )

    # 4. Auto-instrument HTTPX client for outbound requests
    try:
        HTTPXClientInstrumentor().instrument(tracer_provider=provider)
    except Exception as e:
        logger.debug("HTTPX instrumentation note: %s", e)

    logger.info("OpenTelemetry successfully initialized for %s", settings.otel_service_name)
    return provider


def get_tracer() -> trace.Tracer:
    """Return the global SimianX tracer instance."""
    return trace.get_tracer("simianx-sre-engine", settings.app_version)
