"""Experiment service — workload generation and metrics calculation."""

import asyncio
import logging
import math
import time
from datetime import UTC, datetime
from uuid import UUID

import httpx

from app.core.telemetry import MetricsCollector, metrics_collector
from app.models.experiment import Experiment, ExperimentResult
from app.repositories.experiment import InMemoryExperimentRepository
from app.schemas.experiment import ExperimentCreate

logger = logging.getLogger(__name__)

INTENSITY_RPS_MAP = {
    "low": 10,
    "moderate": 25,
    "high": 50,
}

TEST_TARGET_PATH = "/api/v1/test-target"


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
        interval = 1.0 / target_rps
        concurrency_sem = asyncio.Semaphore(20)  # max 20 concurrent connections

        logger.info(
            "Starting experiment %s: target_rps=%d, duration=%ds, url=%s",
            experiment_id,
            target_rps,
            duration_limit,
            target_url,
        )

        async with httpx.AsyncClient(timeout=2.0) as client:
            try:
                while time.time() - start_time < duration_limit:
                    step_start = time.time()

                    async def fire_request() -> None:
                        async with concurrency_sem:
                            req_start = time.perf_counter()
                            try:
                                resp = await client.get(target_url)
                                req_duration = (time.perf_counter() - req_start) * 1000
                                status = resp.status_code
                            except Exception:
                                req_duration = (time.perf_counter() - req_start) * 1000
                                status = 503

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
                logger.info("Experiment %s completed successfully.", experiment_id)

            except asyncio.CancelledError:
                # Workload manually cancelled by stop request
                actual_duration = max(0.1, time.time() - start_time)
                self._compute_results(experiment, samples, actual_duration)
                experiment.status = "stopped"
                experiment.ended_at = datetime.now(UTC)
                self._repo.save(experiment)
                logger.info("Experiment %s stopped by user.", experiment_id)
                raise
            except Exception as e:
                actual_duration = max(0.1, time.time() - start_time)
                self._compute_results(experiment, samples, actual_duration)
                experiment.status = "failed"
                experiment.error_message = str(e)
                experiment.ended_at = datetime.now(UTC)
                self._repo.save(experiment)
                logger.exception(
                    "Experiment %s failed with error: %s", experiment_id, e
                )
            finally:
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
