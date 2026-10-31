"""Experiment service — workload generation and metrics calculation."""

import asyncio
import logging
import math
import random
import time
from datetime import UTC, datetime
from uuid import UUID

import httpx
from opentelemetry import trace

from app.core.otel import get_tracer
from app.core.telemetry import MetricsCollector, metrics_collector
from app.models.experiment import Experiment, ExperimentResult
from app.repositories.experiment import InMemoryExperimentRepository
from app.schemas.experiment import ChaosScenarioInfo, ExperimentCreate

logger = logging.getLogger(__name__)

INTENSITY_RPS_MAP = {
    "low": 10,
    "moderate": 25,
    "high": 50,
}

TEST_TARGET_PATH = "/api/v1/test-target"
FAIL_TARGET_PATH = "/api/v1/fail"

CHAOS_SCENARIOS = [
    ChaosScenarioInfo(
        id="traffic_burst",
        name="Traffic Burst Spike",
        description="Simulates rapid concurrent user spikes to test system throughput and baseline latency.",
        category="Load & Concurrency",
        default_duration=15,
        intensities=["low", "moderate", "high"],
        target_metric="RPS & P95 Latency",
        slo_impact="Verifies ingress capacity and pod autoscaling response under sudden load.",
    ),
    ChaosScenarioInfo(
        id="latency_spike",
        name="P99 Tail Latency Degradation",
        description="Injects artificial Gaussian latency (250ms–1200ms) to test downstream timeout and SLO tail divergence.",
        category="Tail Latency Chaos",
        default_duration=15,
        intensities=["low", "moderate", "high"],
        target_metric="P99 Latency & Duration",
        slo_impact="Surfaces hidden tail-latency bottlenecks before they trigger system timeouts.",
    ),
    ChaosScenarioInfo(
        id="error_spike",
        name="Cascading Fault Injection",
        description="Injects synthetic HTTP 500/503 errors on ~35% of traffic to test error budget consumption and circuit breakers.",
        category="Fault Injection",
        default_duration=15,
        intensities=["low", "moderate", "high"],
        target_metric="Error Rate %",
        slo_impact="Exercises circuit breakers, client retry policies, and error budget burn rate.",
    ),
    ChaosScenarioInfo(
        id="memory_saturation",
        name="Memory Pressure Simulation",
        description="Allocates temporary heap buffers to simulate container memory exhaustion and cgroup pressure.",
        category="Resource Saturation",
        default_duration=15,
        intensities=["low", "moderate", "high"],
        target_metric="Memory Utilization %",
        slo_impact="Validates cgroup limits and alerts ahead of container OOMKilled events.",
    ),
]


class ExperimentService:
    def __init__(
        self,
        repo: InMemoryExperimentRepository,
        collector: MetricsCollector = metrics_collector,
        base_url: str = "http://127.0.0.1:8000",
    ) -> None:
        self._repo = repo
        self._collector = collector
        self._base_url = base_url
        self._active_task: asyncio.Task[None] | None = None
        self._active_experiment_id: UUID | None = None

    def start_experiment(self, data: ExperimentCreate) -> Experiment:
        """Validate safety constraints and launch an experiment in the background."""
        # Safety constraint: Only 1 active experiment at a time
        active = self._repo.get_active()
        if active or (self._active_task and not self._active_task.done()):
            raise ValueError("An experiment is already in progress.")

        # Safety constraint: duration 10 to 30s
        if not (10 <= data.duration_seconds <= 30):
            raise ValueError("Experiment duration must be between 10 and 30 seconds.")

        experiment = Experiment(
            scenario=data.scenario,
            duration_seconds=data.duration_seconds,
            intensity=data.intensity,
            target_endpoint=TEST_TARGET_PATH,
            status="running",
            started_at=datetime.now(UTC),
        )
        self._repo.save(experiment)
        self._active_experiment_id = experiment.id

        # Launch non-blocking workload generator if an event loop is running
        try:
            loop = asyncio.get_running_loop()
            self._active_task = loop.create_task(self._run_workload(experiment.id))
        except RuntimeError:
            self._active_task = None

        return experiment

    async def _run_workload(self, experiment_id: UUID) -> None:
        """Execute controlled load against local target and record measurements."""
        experiment = self._repo.get_by_id(experiment_id)
        if not experiment:
            return

        target_rps = INTENSITY_RPS_MAP.get(experiment.intensity, 10)
        duration_limit = experiment.duration_seconds
        start_time = time.time()
        samples: list[tuple[float, int]] = []  # (duration_ms, status_code)

        target_url = f"{self._base_url}{TEST_TARGET_PATH}"
        fail_url = f"{self._base_url}{FAIL_TARGET_PATH}"
        interval = 1.0 / target_rps
        concurrency_sem = asyncio.Semaphore(25)  # max 25 concurrent connections
        scenario = experiment.scenario

        # For memory pressure simulation: allocate a safe bounded temporary buffer (e.g. 25MB)
        memory_hog: bytearray | None = None
        if scenario == "memory_saturation":
            try:
                # 25 MB allocation
                memory_hog = bytearray(25 * 1024 * 1024)
            except MemoryError:
                logger.warning("Could not allocate memory hog buffer.")

        tracer = get_tracer()

        logger.info(
            "Starting experiment %s (%s): target_rps=%d, duration=%ds",
            experiment_id,
            scenario,
            target_rps,
            duration_limit,
        )

        with tracer.start_as_current_span(
            f"simianx.chaos.{scenario}",
            attributes={
                "simianx.experiment_id": str(experiment_id),
                "simianx.scenario": scenario,
                "simianx.intensity": experiment.intensity,
                "simianx.target_rps": target_rps,
            },
        ) as root_span:
            async with httpx.AsyncClient(timeout=4.0) as client:
                try:
                    while time.time() - start_time < duration_limit:
                        step_start = time.time()

                        async def fire_request() -> None:
                            async with concurrency_sem:
                                req_start = time.perf_counter()
                                req_url = target_url

                                # 1. Chaos injection: Cascading Faults (error_spike)
                                if scenario == "error_spike" and random.random() < 0.35:
                                    req_url = f"{fail_url}?status_code={random.choice([500, 503, 502])}"

                                # 2. Chaos injection: Tail Latency degradation (latency_spike)
                                simulated_delay = 0.0
                                if scenario == "latency_spike":
                                    # Gaussian tail latency distribution (heavy tail)
                                    if random.random() < 0.40:
                                        simulated_delay = random.uniform(0.25, 0.95)
                                        await asyncio.sleep(simulated_delay)

                                with tracer.start_as_current_span(
                                    f"workload.{scenario}",
                                    attributes={
                                        "http.url": req_url,
                                        "simianx.scenario": scenario,
                                        "simianx.injected_delay_s": simulated_delay,
                                    },
                                ) as req_span:
                                    try:
                                        resp = await client.get(req_url)
                                        req_duration = (time.perf_counter() - req_start) * 1000
                                        status = resp.status_code
                                        req_span.set_attribute("http.status_code", status)
                                        if status >= 400:
                                            req_span.set_status(trace.StatusCode.ERROR, f"HTTP {status}")
                                    except Exception as exc:
                                        req_duration = (time.perf_counter() - req_start) * 1000
                                        status = 503
                                        req_span.set_attribute("http.status_code", status)
                                        req_span.set_status(trace.StatusCode.ERROR, str(exc))

                                samples.append((req_duration, status))
                                self._collector.record_request(req_duration, status)

                        # Fire request in background
                        asyncio.create_task(fire_request())

                        # Pace to target rate
                        elapsed = time.time() - step_start
                        sleep_time = interval - elapsed
                        if sleep_time > 0:
                            await asyncio.sleep(sleep_time)

                    # Grace period for in-flight requests to complete
                    await asyncio.sleep(0.5)

                    actual_duration = time.time() - start_time
                    self._compute_results(experiment, samples, actual_duration)
                    experiment.status = "completed"
                    experiment.ended_at = datetime.now(UTC)
                    self._repo.save(experiment)
                    root_span.set_attribute("simianx.samples_count", len(samples))
                    logger.info("Experiment %s (%s) completed successfully.", experiment_id, scenario)

                except asyncio.CancelledError:
                    actual_duration = max(0.1, time.time() - start_time)
                    self._compute_results(experiment, samples, actual_duration)
                    experiment.status = "stopped"
                    experiment.ended_at = datetime.now(UTC)
                    self._repo.save(experiment)
                    root_span.set_status(trace.StatusCode.ERROR, "Cancelled by user")
                    logger.info("Experiment %s stopped by user.", experiment_id)
                    raise
                except Exception as e:
                    actual_duration = max(0.1, time.time() - start_time)
                    self._compute_results(experiment, samples, actual_duration)
                    experiment.status = "failed"
                    experiment.error_message = str(e)
                    experiment.ended_at = datetime.now(UTC)
                    self._repo.save(experiment)
                    root_span.set_status(trace.StatusCode.ERROR, str(e))
                    logger.exception("Experiment %s failed with error: %s", experiment_id, e)
                finally:
                    # Release memory hog buffer if allocated
                    if memory_hog is not None:
                        del memory_hog
                    if self._active_experiment_id == experiment_id:
                        self._active_experiment_id = None
                        self._active_task = None

    def _compute_results(
        self,
        experiment: Experiment,
        samples: list[tuple[float, int]],
        actual_duration: float,
    ) -> None:
        """Compute real statistical metrics from samples collected during the run."""
        total = len(samples)
        successful = sum(1 for _, code in samples if code < 400)
        failed = total - successful
        achieved_rps = round(total / actual_duration, 2) if actual_duration > 0 else 0.0

        status_codes: dict[str, int] = {}
        durations: list[float] = []

        for dur, code in samples:
            durations.append(dur)
            code_str = str(code)
            status_codes[code_str] = status_codes.get(code_str, 0) + 1

        if durations:
            durations.sort()
            n = len(durations)

            def quantile(q: float) -> float:
                idx = max(0, min(n - 1, math.ceil(q * n) - 1))
                return round(durations[idx], 2)

            p50 = quantile(0.50)
            p90 = quantile(0.90)
            p95 = quantile(0.95)
            p99 = quantile(0.99)
        else:
            p50 = p90 = p95 = p99 = 0.0

        error_rate = round((failed / total) * 100, 2) if total > 0 else 0.0

        experiment.results = ExperimentResult(
            total_requests=total,
            successful_requests=successful,
            failed_requests=failed,
            achieved_rps=achieved_rps,
            p50_latency_ms=p50,
            p90_latency_ms=p90,
            p95_latency_ms=p95,
            p99_latency_ms=p99,
            error_rate=error_rate,
            status_codes=status_codes,
            duration_seconds=round(actual_duration, 2),
        )

    def stop_experiment(self, experiment_id: UUID) -> Experiment | None:
        """Stop a running experiment. Safe on already stopped/completed runs."""
        experiment = self._repo.get_by_id(experiment_id)
        if not experiment:
            return None

        if experiment.status == "running":
            if self._active_task and not self._active_task.done():
                self._active_task.cancel()
            else:
                experiment.status = "stopped"
                experiment.ended_at = datetime.now(UTC)
                self._repo.save(experiment)

        return experiment

    def get_by_id(self, experiment_id: UUID) -> Experiment | None:
        return self._repo.get_by_id(experiment_id)

    def list_recent(self, limit: int = 20) -> list[Experiment]:
        return self._repo.list_recent(limit=limit)

    def get_metrics(self) -> dict[str, float | int | str | dict[str, int]]:
        return self._collector.get_snapshot()

    def get_time_series(
        self,
        window_seconds: int = 60,
        bucket_seconds: int = 1,
    ) -> list[dict[str, float | int | str | None]]:
        return self._collector.get_time_series(
            window_seconds=window_seconds,
            bucket_seconds=bucket_seconds,
        )

    def list_chaos_scenarios(self) -> list[ChaosScenarioInfo]:
        return CHAOS_SCENARIOS
