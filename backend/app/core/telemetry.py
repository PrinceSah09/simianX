"""Runtime telemetry collector — records real application and experiment metrics."""

import math
import time
from collections import deque
from threading import Lock


class MetricsCollector:
    """Thread-safe real-time telemetry metrics registry."""

    def __init__(self, window_seconds: float = 10.0) -> None:
        self._start_time = time.time()
        self._lock = Lock()
        self._window_seconds = window_seconds

        # Cumulative counters
        self._total_requests: int = 0
        self._error_count: int = 0
        self._status_codes: dict[str, int] = {}

        # Sliding-window history for RPS and latency quantiles:
        # deque of (timestamp, duration_ms, status_code)
        self._history: deque[tuple[float, float, int]] = deque(maxlen=20000)

    def record_request(self, duration_ms: float, status_code: int) -> None:
        """Record an observed HTTP request with duration in ms and response status."""
        now = time.time()
        with self._lock:
            self._total_requests += 1
            if status_code >= 400:
                self._error_count += 1

            code_str = str(status_code)
            self._status_codes[code_str] = self._status_codes.get(code_str, 0) + 1

            self._history.append((now, duration_ms, status_code))

    def _prune_old_records(self, now: float) -> list[tuple[float, float, int]]:
        cutoff = now - self._window_seconds
        # Return records within the rolling window
        return [item for item in self._history if item[0] >= cutoff]

    def get_snapshot(self) -> dict[str, float | int | str | dict[str, int]]:
        """Compute real telemetry snapshot from collected request samples."""
        now = time.time()
        with self._lock:
            recent = self._prune_old_records(now)
            total = self._total_requests
            errors = self._error_count
            status_codes = dict(self._status_codes)
            uptime = round(now - self._start_time, 1)

            # Window-specific calculations (strictly within the rolling window)
            window_requests = len(recent)
            window_errors = sum(1 for item in recent if item[2] >= 400)
            window_error_rate = (
                round((window_errors / window_requests) * 100, 2)
                if window_requests > 0
                else 0.0
            )
            rps = round(window_requests / self._window_seconds, 1)

            # Compute real percentiles for requests in the active window
            durations = [item[1] for item in recent]
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

            # Cumulative calculations
            error_rate = round((errors / total) * 100, 2) if total > 0 else 0.0

            # Determine service health based on error rate and latency
            active_error_rate = window_error_rate if window_requests > 0 else error_rate
            if active_error_rate > 15.0:
                service_status = "unhealthy"
            elif active_error_rate > 5.0 or (window_requests > 0 and p95 > 250.0):
                service_status = "degraded"
            else:
                service_status = "healthy"

            return {
                "total_requests": total,
                "requests_per_second": rps,
                "p50_latency_ms": p50,
                "p90_latency_ms": p90,
                "p95_latency_ms": p95,
                "p99_latency_ms": p99,
                "error_count": errors,
                "error_rate": error_rate,
                "status_codes": status_codes,
                "service_status": service_status,
                "uptime_seconds": uptime,
                "timestamp": now,
                "window_requests": window_requests,
                "window_errors": window_errors,
                "window_error_rate": window_error_rate,
                "window_duration_seconds": self._window_seconds,
            }

    def get_time_series(
        self,
        window_seconds: int = 60,
        bucket_seconds: int = 1,
    ) -> list[dict[str, float | int | str | None]]:
        """Aggregate real recorded requests into timestamped time-series buckets.

        Only real observed measurements are returned. If no requests occurred
        in a bucket, latency is None and error_rate is 0.0.
        """
        now = time.time()
        # Align to bucket boundary
        current_bucket_start = math.floor(now / bucket_seconds) * bucket_seconds
        start_time = current_bucket_start - (window_seconds - bucket_seconds)

        with self._lock:
            relevant = [
                (t, d, s)
                for t, d, s in self._history
                if start_time <= t < current_bucket_start + bucket_seconds
            ]

        # Initialize contiguous fixed buckets
        num_buckets = max(1, window_seconds // bucket_seconds)
        buckets: dict[int, list[tuple[float, int]]] = {
            int(start_time + i * bucket_seconds): [] for i in range(num_buckets)
        }

        for t, d, s in relevant:
            b_key = int(math.floor(t / bucket_seconds) * bucket_seconds)
            if b_key in buckets:
                buckets[b_key].append((d, s))

        results: list[dict[str, float | int | str | None]] = []
        for b_time in sorted(buckets.keys()):
            items = buckets[b_time]
            count = len(items)
            rps = round(count / bucket_seconds, 1)
            b_errors = sum(1 for _, s in items if s >= 400)
            b_error_rate = round((b_errors / count) * 100, 2) if count > 0 else 0.0

            if items:
                durations = sorted(d for d, _ in items)
                n = len(durations)

                def quant(
                    q: float,
                    d: list[float] = durations,
                    length: int = n,
                ) -> float:
                    idx = max(0, min(length - 1, math.ceil(q * length) - 1))
                    return round(d[idx], 2)

                p50_val: float | None = quant(0.50)
                p95_val: float | None = quant(0.95)
                p99_val: float | None = quant(0.99)
            else:
                p50_val = None
                p95_val = None
                p99_val = None

            # Format UTC time string (HH:MM:SS)
            iso_time = time.strftime("%H:%M:%S", time.gmtime(b_time))

            results.append(
                {
                    "timestamp": float(b_time),
                    "iso_time": iso_time,
                    "requests": count,
                    "rps": rps,
                    "p50_latency_ms": p50_val,
                    "p95_latency_ms": p95_val,
                    "p99_latency_ms": p99_val,
                    "error_count": b_errors,
                    "error_rate": b_error_rate,
                }
            )

        return results

    def reset(self) -> None:
        """Reset metrics (for test isolation)."""
        with self._lock:
            self._total_requests = 0
            self._error_count = 0
            self._status_codes.clear()
            self._history.clear()
            self._start_time = time.time()


# Global telemetry collector singleton for the service
metrics_collector = MetricsCollector()
