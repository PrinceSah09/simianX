"""Slack Alerter service — dispatches sleek, Apple-grade incident alerts and resolution notices."""

import logging
import time
from collections import deque
from datetime import UTC, datetime
from threading import RLock
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class SlackAlerter:
    """Thread-safe Slack alerting engine for SimianX SRE telemetry and incidents."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._webhook_url: str | None = settings.slack_webhook_url
        self._channel: str = settings.slack_channel
        self._enabled: bool = settings.slack_alerts_enabled
        self._cooldown_seconds: int = settings.alert_cooldown_seconds
        self._error_threshold_pct: float = settings.alert_error_threshold_pct
        self._latency_threshold_ms: float = settings.alert_latency_threshold_ms

        # Incident state machine
        self._is_firing: bool = False
        self._active_alert_type: str | None = None
        self._incident_start_time: float | None = None
        self._last_alert_time: float = 0.0
        self._consecutive_bad_checks: int = 0
        self._consecutive_healthy_checks: int = 0

        # In-memory history for UI inspection
        self._history: deque[dict[str, Any]] = deque(maxlen=50)

    @property
    def webhook_url(self) -> str | None:
        with self._lock:
            return self._webhook_url

    def set_config(
        self,
        webhook_url: str | None = None,
        channel: str | None = None,
        enabled: bool | None = None,
        cooldown_seconds: int | None = None,
        error_threshold_pct: float | None = None,
        latency_threshold_ms: float | None = None,
    ) -> dict[str, Any]:
        """Update Slack configuration dynamically at runtime."""
        with self._lock:
            if webhook_url is not None:
                self._webhook_url = webhook_url.strip() or None
            if channel is not None:
                self._channel = channel.strip()
            if enabled is not None:
                self._enabled = enabled
            if cooldown_seconds is not None:
                self._cooldown_seconds = max(10, cooldown_seconds)
            if error_threshold_pct is not None:
                self._error_threshold_pct = max(1.0, error_threshold_pct)
            if latency_threshold_ms is not None:
                self._latency_threshold_ms = max(50.0, latency_threshold_ms)

        return self.get_status()

    def _mask_webhook(self, url: str | None) -> str | None:
        if not url:
            return None
        parts = url.split("/")
        if len(parts) >= 3:
            return f"{'/'.join(parts[:-1])}/***REDACTED***"
        return "https://hooks.slack.com/***REDACTED***"

    def get_status(self) -> dict[str, Any]:
        """Return current alerting status and active incident details."""
        with self._lock:
            active_duration_s = (
                round(time.time() - self._incident_start_time, 1)
                if self._incident_start_time and self._is_firing
                else 0.0
            )

            return {
                "enabled": self._enabled,
                "configured": bool(self._webhook_url),
                "webhook_masked": self._mask_webhook(self._webhook_url),
                "channel": self._channel,
                "cooldown_seconds": self._cooldown_seconds,
                "error_threshold_pct": self._error_threshold_pct,
                "latency_threshold_ms": self._latency_threshold_ms,
                "is_firing": self._is_firing,
                "active_incident": {
                    "type": self._active_alert_type,
                    "duration_seconds": active_duration_s,
                    "started_at": (
                        datetime.fromtimestamp(self._incident_start_time, tz=UTC).isoformat()
                        if self._incident_start_time
                        else None
                    ),
                }
                if self._is_firing
                else None,
                "recent_alerts": list(self._history),
            }

    async def _post_to_slack(self, payload: dict[str, Any], target_webhook: str | None = None) -> tuple[bool, str]:
        """Post formatted payload to Slack incoming webhook URL."""
        webhook = target_webhook or self._webhook_url
        if not webhook:
            return False, "Slack Webhook URL is not configured."

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(webhook, json=payload)
                if resp.status_code == 200:
                    return True, "Slack notification sent successfully."
                return False, f"Slack responded with status {resp.status_code}: {resp.text}"
        except Exception as e:
            logger.error("Failed to deliver Slack notification: %s", e)
            return False, f"Failed connecting to Slack: {e}"

    async def send_test_alert(self, custom_webhook: str | None = None) -> tuple[bool, str]:
        """Send a simple test verification alert to verify the webhook configuration."""
        webhook = custom_webhook or self.webhook_url
        if not webhook:
            return False, "No Slack Webhook URL provided."

        now_str = datetime.now(UTC).strftime("%H:%M:%S UTC")
        payload = {
            "text": "SimianX: Notification test verified",
            "attachments": [
                {
                    "color": "#0071e3",
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "*Notification Test*\nSlack alerting is active and verified.",
                            },
                        },
                        {
                            "type": "context",
                            "elements": [
                                {"type": "mrkdwn", "text": f"SimianX · {now_str}"}
                            ],
                        },
                    ],
                }
            ],
        }

        success, msg = await self._post_to_slack(payload, target_webhook=webhook)
        with self._lock:
            self._history.appendleft({
                "timestamp": now_str,
                "type": "TEST_ALERT",
                "severity": "INFO",
                "status": "SUCCESS" if success else "FAILED",
                "message": msg,
            })
        return success, msg

    async def send_incident_alert(
        self,
        alert_type: str,
        severity: str,
        title: str,
        reason: str,
        telemetry: dict[str, Any],
    ) -> bool:
        """Dispatch a sleek incident alert card to Slack."""
        now_str = datetime.now(UTC).strftime("%H:%M:%S UTC")
        is_critical = severity.upper() == "CRITICAL"
        color = "#ff3b30" if is_critical else "#ff9500"

        error_rate = telemetry.get("window_error_rate", telemetry.get("error_rate", 0.0))
        p95 = telemetry.get("p95_latency_ms", 0.0)
        rps = telemetry.get("requests_per_second", 0.0)

        payload = {
            "text": f"SimianX Alert: {title} ({error_rate:.1f}%)",
            "attachments": [
                {
                    "color": color,
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"*{title}*\n{reason}",
                            },
                        },
                        {
                            "type": "section",
                            "fields": [
                                {"type": "mrkdwn", "text": f"*Error Rate*\n{error_rate:.1f}%"},
                                {"type": "mrkdwn", "text": f"*P95 Latency*\n{p95:.1f} ms"},
                                {"type": "mrkdwn", "text": f"*Throughput*\n{rps:.1f} req/s"},
                            ],
                        },
                        {
                            "type": "context",
                            "elements": [
                                {
                                    "type": "mrkdwn",
                                    "text": f"SimianX · {severity.upper()} · {now_str}",
                                }
                            ],
                        },
                    ],
                }
            ],
        }

        success, msg = await self._post_to_slack(payload)
        with self._lock:
            self._history.appendleft({
                "timestamp": now_str,
                "type": alert_type,
                "severity": severity.upper(),
                "status": "SENT" if success else "FAILED",
                "message": reason,
                "metrics": {"error_rate": error_rate, "p95_ms": p95, "rps": rps},
            })
        return success

    async def send_resolution_notice(self, incident_type: str, duration_s: float, telemetry: dict[str, Any]) -> bool:
        """Dispatch a clean resolution notice to Slack."""
        now_str = datetime.now(UTC).strftime("%H:%M:%S UTC")
        mins, secs = divmod(int(duration_s), 60)
        duration_fmt = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"

        error_rate = telemetry.get("window_error_rate", telemetry.get("error_rate", 0.0))
        p95 = telemetry.get("p95_latency_ms", 0.0)

        payload = {
            "text": "SimianX: System health restored",
            "attachments": [
                {
                    "color": "#34c759",
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"*Resolved: System Health Restored*\nIncident cleared after {duration_fmt}. Telemetry returned to normal.",
                            },
                        },
                        {
                            "type": "section",
                            "fields": [
                                {"type": "mrkdwn", "text": f"*Error Rate*\n{error_rate:.1f}%"},
                                {"type": "mrkdwn", "text": f"*P95 Latency*\n{p95:.1f} ms"},
                                {"type": "mrkdwn", "text": "*Status*\nHealthy"},
                            ],
                        },
                        {
                            "type": "context",
                            "elements": [
                                {
                                    "type": "mrkdwn",
                                    "text": f"SimianX · Resolved · {now_str}",
                                }
                            ],
                        },
                    ],
                }
            ],
        }

        success, _ = await self._post_to_slack(payload)
        with self._lock:
            self._history.appendleft({
                "timestamp": now_str,
                "type": f"RESOLVED: {incident_type}",
                "severity": "RESOLVED",
                "status": "SENT" if success else "FAILED",
                "message": f"Resolved after {duration_fmt}",
                "metrics": {"error_rate": error_rate, "p95_ms": p95, "rps": telemetry.get("requests_per_second", 0.0)},
            })
        return success

    async def evaluate_telemetry(self, snapshot: dict[str, Any], active_scenario: str | None = None) -> None:
        """Evaluate real-time telemetry snapshot and trigger incident alerts or resolutions."""
        if not self._enabled:
            return

        now = time.time()
        error_rate = float(snapshot.get("window_error_rate", snapshot.get("error_rate", 0.0)))
        p95 = float(snapshot.get("p95_latency_ms", 0.0))
        rps = float(snapshot.get("requests_per_second", 0.0))
        total_requests = int(snapshot.get("total_requests", 0))

        telemetry_ctx = {
            "window_error_rate": error_rate,
            "p95_latency_ms": p95,
            "requests_per_second": rps,
            "active_scenario": active_scenario or "Live Workload",
        }

        # Check for bad conditions (requires active ongoing traffic or observed failure requests)
        is_bad = False
        alert_type = None
        severity = "warning"
        title = ""
        reason = ""

        has_active_traffic = rps > 0.1 or total_requests > 0

        if has_active_traffic and error_rate > self._error_threshold_pct:
            is_bad = True
            severity = "critical" if error_rate > 15.0 else "warning"
            alert_type = "HIGH_ERROR_RATE"
            title = f"High Error Rate ({error_rate:.1f}%)"
            reason = f"Error rate reached {error_rate:.1f}% (threshold {self._error_threshold_pct}%)."
        elif has_active_traffic and p95 > self._latency_threshold_ms and rps > 0.5:
            is_bad = True
            severity = "warning"
            alert_type = "HIGH_P95_LATENCY"
            title = f"P95 Latency SLA Breached ({p95:.1f}ms)"
            reason = f"P95 response time reached {p95:.1f}ms (threshold {self._latency_threshold_ms}ms)."

        # State transition handling (compute transitions under lock, dispatch outside lock)
        should_send_alert = False
        should_send_resolution = False
        incident_duration = 0.0
        prev_type = ""

        with self._lock:
            if is_bad:
                self._consecutive_bad_checks += 1
                self._consecutive_healthy_checks = 0

                can_alert = (not self._is_firing) or (now - self._last_alert_time >= self._cooldown_seconds)
                if can_alert:
                    if not self._is_firing:
                        self._incident_start_time = now
                    self._is_firing = True
                    self._active_alert_type = alert_type
                    self._last_alert_time = now
                    should_send_alert = True
            else:
                self._consecutive_healthy_checks += 1
                self._consecutive_bad_checks = 0

                if self._is_firing and self._consecutive_healthy_checks >= 2:
                    incident_duration = now - (self._incident_start_time or now)
                    prev_type = self._active_alert_type or "System Incident"
                    self._is_firing = False
                    self._active_alert_type = None
                    self._incident_start_time = None
                    self._consecutive_healthy_checks = 0
                    should_send_resolution = True

        if should_send_alert:
            await self.send_incident_alert(
                alert_type=alert_type or "SYSTEM_DEGRADED",
                severity=severity,
                title=title,
                reason=reason,
                telemetry=telemetry_ctx,
            )
        elif should_send_resolution:
            await self.send_resolution_notice(
                incident_type=prev_type,
                duration_s=incident_duration,
                telemetry=telemetry_ctx,
            )


# Global singleton instance
slack_alerter = SlackAlerter()
