"""Integration tests for SRE experiments and metrics endpoints."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.routes.experiments import _experiment_repo
from app.core.telemetry import metrics_collector
from app.main import app
from app.models.experiment import Experiment


@pytest.fixture(autouse=True)
def clean_state() -> None:
    """Ensure clean state before each test."""
    _experiment_repo.clear()
    metrics_collector.reset()
    yield
    _experiment_repo.clear()


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


def test_get_metrics_returns_real_telemetry(client: TestClient) -> None:
    # Trigger a request so telemetry records it
    client.get("/api/v1/test-target")

    resp = client.get("/api/v1/metrics")
    assert resp.status_code == 200
    data = resp.json()

    assert "total_requests" in data
    assert "requests_per_second" in data
    assert "p50_latency_ms" in data
    assert "p95_latency_ms" in data
    assert "error_rate" in data
    assert "service_status" in data
    assert data["total_requests"] >= 1
    assert "window_requests" in data
    assert "timestamp" in data


def test_get_metrics_series_returns_real_buckets(client: TestClient) -> None:
    # Trigger requests to generate real observations
    client.get("/api/v1/test-target")
    client.get("/api/v1/test-target")

    resp = client.get("/api/v1/metrics/series?window_seconds=30&bucket_seconds=1")
    assert resp.status_code == 200
    data = resp.json()

    assert "points" in data
    assert "window_seconds" in data
    assert data["window_seconds"] == 30
    assert len(data["points"]) == 30

    # Ensure at least one bucket contains our 2 observed requests
    total_in_buckets = sum(p["requests"] for p in data["points"])
    assert total_in_buckets >= 2
    # Active bucket must have genuine calculated RPS and latency
    active_points = [p for p in data["points"] if p["requests"] > 0]
    assert len(active_points) > 0
    assert active_points[0]["p95_latency_ms"] is not None


def test_test_target_returns_ok(client: TestClient) -> None:
    resp = client.get("/api/v1/test-target")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


def test_create_experiment_success(client: TestClient) -> None:
    payload = {
        "scenario": "traffic_burst",
        "duration_seconds": 10,
        "intensity": "low",
    }
    resp = client.post("/api/v1/experiments", json=payload)
    assert resp.status_code == 201
    data = resp.json()

    assert "id" in data
    assert data["scenario"] == "traffic_burst"
    assert data["status"] == "running"
    assert data["duration_seconds"] == 10

    # Clean up by stopping
    client.post(f"/api/v1/experiments/{data['id']}/stop")


def test_create_experiment_rejects_invalid_duration(client: TestClient) -> None:
    # Duration < 10 must fail schema validation
    resp = client.post(
        "/api/v1/experiments",
        json={"scenario": "traffic_burst", "duration_seconds": 5, "intensity": "low"},
    )
    assert resp.status_code == 422

    # Duration > 30 must fail schema validation
    resp2 = client.post(
        "/api/v1/experiments",
        json={"scenario": "traffic_burst", "duration_seconds": 45, "intensity": "low"},
    )
    assert resp2.status_code == 422


def test_create_experiment_prevents_concurrent_runs(client: TestClient) -> None:
    # Seed an active running experiment in repo
    active_exp = Experiment(
        scenario="traffic_burst",
        duration_seconds=20,
        intensity="low",
        target_endpoint="/api/v1/test-target",
        status="running",
    )
    _experiment_repo.save(active_exp)

    payload = {
        "scenario": "traffic_burst",
        "duration_seconds": 20,
        "intensity": "low",
    }
    resp = client.post("/api/v1/experiments", json=payload)
    assert resp.status_code == 409
    assert "already in progress" in resp.json()["detail"]


def test_get_experiment_by_id(client: TestClient) -> None:
    payload = {
        "scenario": "traffic_burst",
        "duration_seconds": 10,
        "intensity": "low",
    }
    create_resp = client.post("/api/v1/experiments", json=payload)
    exp_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/v1/experiments/{exp_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == exp_id

    client.post(f"/api/v1/experiments/{exp_id}/stop")


def test_get_nonexistent_experiment_returns_404(client: TestClient) -> None:
    resp = client.get(f"/api/v1/experiments/{uuid4()}")
    assert resp.status_code == 404


def test_stop_experiment_endpoint(client: TestClient) -> None:
    payload = {
        "scenario": "traffic_burst",
        "duration_seconds": 15,
        "intensity": "low",
    }
    create_resp = client.post("/api/v1/experiments", json=payload)
    exp_id = create_resp.json()["id"]

    stop_resp = client.post(f"/api/v1/experiments/{exp_id}/stop")
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "stopped"


def test_list_experiments_returns_history(client: TestClient) -> None:
    # Initially empty
    resp = client.get("/api/v1/experiments")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0

    # Start and stop an experiment
    create_resp = client.post(
        "/api/v1/experiments",
        json={"scenario": "traffic_burst", "duration_seconds": 10, "intensity": "low"},
    )
    exp_id = create_resp.json()["id"]
    client.post(f"/api/v1/experiments/{exp_id}/stop")

    list_resp = client.get("/api/v1/experiments")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1
    assert list_resp.json()["items"][0]["id"] == exp_id


def test_get_infrastructure_endpoint(client: TestClient) -> None:
    resp = client.get("/api/v1/infrastructure")
    assert resp.status_code == 200
    data = resp.json()
    assert "cluster_mode" in data
    assert "deployment_name" in data
    assert "desired_replicas" in data
    assert "ready_replicas" in data
    assert "pods" in data
    assert isinstance(data["pods"], list)
    assert "prometheus" in data
    assert "connected" in data["prometheus"]
