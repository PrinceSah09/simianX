"""Unit tests for Slack Alerter service."""

import pytest

from app.services.slack_alerter import SlackAlerter


@pytest.fixture
def alerter():
    inst = SlackAlerter()
    inst.set_config(
        webhook_url="https://hooks.slack.com/services/mock/token/mocktoken",
        channel="#test-alerts",
        enabled=True,
        cooldown_seconds=30,
        error_threshold_pct=5.0,
        latency_threshold_ms=250.0,
    )
    return inst


def test_slack_alerter_initial_state(alerter):
    status = alerter.get_status()
    assert status["enabled"] is True
    assert status["configured"] is True
    assert status["channel"] == "#test-alerts"
    assert status["is_firing"] is False
    assert status["active_incident"] is None
    assert "webhook_masked" in status
    assert "mocktoken" not in status["webhook_masked"]


def test_slack_alerter_set_config(alerter):
    status = alerter.set_config(
        channel="#sre-critical",
        cooldown_seconds=120,
        error_threshold_pct=10.0,
    )
    assert status["channel"] == "#sre-critical"
    assert status["cooldown_seconds"] == 120
    assert status["error_threshold_pct"] == 10.0


@pytest.mark.anyio
async def test_slack_alerter_evaluate_telemetry_triggers_incident(alerter, monkeypatch):
    sent_payloads = []

    async def mock_post(payload, target_webhook=None):
        sent_payloads.append(payload)
        return True, "ok"

    monkeypatch.setattr(alerter, "_post_to_slack", mock_post)

    # Bad condition: 25% errors
    bad_snapshot = {
        "window_error_rate": 25.0,
        "p95_latency_ms": 45.0,
        "service_status": "unhealthy",
        "requests_per_second": 30.0,
    }

    await alerter.evaluate_telemetry(bad_snapshot, active_scenario="Chaos Error Injection")

    assert alerter.get_status()["is_firing"] is True
    assert len(sent_payloads) == 1
    assert "High Error Rate" in str(sent_payloads[0])


@pytest.mark.anyio
async def test_slack_alerter_auto_resolves_incident(alerter, monkeypatch):
    sent_payloads = []

    async def mock_post(payload, target_webhook=None):
        sent_payloads.append(payload)
        return True, "ok"

    monkeypatch.setattr(alerter, "_post_to_slack", mock_post)

    # 1. Trigger incident
    bad_snapshot = {
        "window_error_rate": 30.0,
        "p95_latency_ms": 10.0,
        "service_status": "unhealthy",
        "requests_per_second": 20.0,
    }
    await alerter.evaluate_telemetry(bad_snapshot)
    assert alerter.get_status()["is_firing"] is True

    # 2. First healthy cycle (recovery debounce)
    healthy_snapshot = {
        "window_error_rate": 0.0,
        "p95_latency_ms": 4.0,
        "service_status": "healthy",
        "requests_per_second": 10.0,
    }
    await alerter.evaluate_telemetry(healthy_snapshot)
    assert alerter.get_status()["is_firing"] is True  # Needs 2 consecutive healthy checks

    # 3. Second healthy cycle -> triggers resolution!
    await alerter.evaluate_telemetry(healthy_snapshot)
    assert alerter.get_status()["is_firing"] is False
    assert len(sent_payloads) == 2
    assert "Resolved" in str(sent_payloads[1])
