"""Integration tests for GET /health and GET /."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


# Shared client — created once per module, not per test.
@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


def test_health_returns_200(client: TestClient) -> None:
    assert client.get("/health").status_code == 200


def test_health_response_body(client: TestClient) -> None:
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["service"] == settings.app_name
    assert body["version"] == settings.app_version


def test_health_content_type(client: TestClient) -> None:
    response = client.get("/health")
    assert "application/json" in response.headers["content-type"]


def test_root_endpoint(client: TestClient) -> None:
    body = client.get("/").json()
    assert "message" in body
    assert "docs" in body


def test_prometheus_metrics_endpoint(client: TestClient) -> None:
    # Trigger a request so counter and histogram are populated
    client.get("/api/v1/test-target")

    res = client.get("/metrics")
    assert res.status_code == 200
    assert "text/plain" in res.headers["content-type"]
    text = res.text
    assert "simianx_http_requests_total" in text
    assert "simianx_http_request_duration_seconds" in text
    assert 'endpoint="/api/v1/test-target"' in text
