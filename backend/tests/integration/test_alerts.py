"""Integration tests for Slack alerts API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.slack_alerter import slack_alerter


@pytest.fixture(autouse=True)
def reset_alerter():
    slack_alerter.set_config(
        webhook_url=None,
        channel="#sre-alerts",
        enabled=True,
        cooldown_seconds=60,
    )


@pytest.mark.anyio
async def test_get_alerts_status():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/alerts/status")
        assert response.status_code == 200
        data = response.json()
        assert data["configured"] is False
        assert data["channel"] == "#sre-alerts"
        assert data["is_firing"] is False


@pytest.mark.anyio
async def test_update_alerts_config():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/alerts/config",
            json={
                "webhook_url": "https://hooks.slack.com/services/mock/token/secrettoken",
                "channel": "#production-incidents",
                "cooldown_seconds": 90,
                "error_threshold_pct": 8.0,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["configured"] is True
        assert data["channel"] == "#production-incidents"
        assert data["cooldown_seconds"] == 90
        assert data["error_threshold_pct"] == 8.0
        assert "secrettoken" not in data["webhook_masked"]


@pytest.mark.anyio
async def test_send_test_alert_success(monkeypatch):
    async def mock_post(payload, target_webhook=None):
        return True, "Slack notification sent successfully."

    monkeypatch.setattr(slack_alerter, "_post_to_slack", mock_post)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/alerts/test",
            json={"webhook_url": "https://hooks.slack.com/services/mock/token/mock"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

