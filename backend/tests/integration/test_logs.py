"""Integration tests for dedicated /api/v1/logs routes."""

import pytest
from fastapi.testclient import TestClient

from app.core.telemetry import metrics_collector
from app.main import app
from app.services.experiment import ExperimentService


@pytest.fixture(autouse=True)
def clean_state() -> None:
    """Ensure clean state before each test."""
    ExperimentService.clear_logs()
    metrics_collector.reset()
    yield
    ExperimentService.clear_logs()


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


def test_get_logs_returns_list(client: TestClient) -> None:
    resp = client.get("/api/v1/logs")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_get_logs_with_entries_and_filtering(client: TestClient) -> None:
    # Append test log items
    ExperimentService.append_request_log({
        "id": "log-1",
        "timestamp": "12:00:00.00",
        "level": "INFO",
        "endpoint": "/api/v1/test-target",
        "status": 200,
        "durationMs": 5.0,
        "traceId": "tr-abc12345",
        "message": "",
    })
    ExperimentService.append_request_log({
        "id": "log-2",
        "timestamp": "12:00:01.00",
        "level": "ERROR",
        "endpoint": "/api/v1/fail?status_code=500",
        "status": 500,
        "durationMs": 85.0,
        "traceId": "tr-def67890",
        "message": "chaos fault injection",
    })

    # 1. Fetch all
    resp = client.get("/api/v1/logs")
    assert resp.status_code == 200
    assert resp.json()["total"] == 2

    # 2. Filter by status code 500
    resp_500 = client.get("/api/v1/logs?status_code=500")
    assert resp_500.status_code == 200
    items_500 = resp_500.json()["items"]
    assert len(items_500) == 1
    assert items_500[0]["status"] == 500

    # 3. Filter by search query
    resp_search = client.get("/api/v1/logs?search=fault")
    assert resp_search.status_code == 200
    assert len(resp_search.json()["items"]) == 1

    # 4. Filter by min duration (slow requests)
    resp_slow = client.get("/api/v1/logs?min_duration_ms=50")
    assert resp_slow.status_code == 200
    assert len(resp_slow.json()["items"]) == 1
    assert resp_slow.json()["items"][0]["durationMs"] >= 50.0


def test_clear_logs_endpoint(client: TestClient) -> None:
    ExperimentService.append_request_log({
        "id": "log-1",
        "timestamp": "12:00:00.00",
        "level": "INFO",
        "endpoint": "/api/v1/test-target",
        "status": 200,
        "durationMs": 5.0,
        "traceId": "tr-abc12345",
        "message": "",
    })
    resp = client.delete("/api/v1/logs")
    assert resp.status_code == 200
    assert resp.json()["status"] == "cleared"

    resp_after = client.get("/api/v1/logs")
    assert resp_after.status_code == 200
    assert resp_after.json()["total"] == 0

