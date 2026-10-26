"""Pydantic schemas for Kubernetes infrastructure and Prometheus discovery status."""

from pydantic import BaseModel, ConfigDict


class PodInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    node: str | None = None
    ip: str | None = None
    phase: str = "Running"
    ready: bool = True
    restarts: int = 0
    started_at: str | None = None
    memory_mb: float | None = None
    open_fds: int | None = None


class TargetInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pod_name: str
    instance: str
    health: str
    last_scrape: str | None = None
    scrape_duration_ms: float = 0.0


class PrometheusStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    connected: bool = False
    url: str = ""
    active_targets_count: int = 0
    healthy_targets_count: int = 0
    targets: list[TargetInfo] = []


class StorageVitals(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_bytes: int = 0
    used_bytes: int = 0
    free_bytes: int = 0
    used_percent: float = 0.0
    total_gb: float = 0.0
    used_gb: float = 0.0
    free_gb: float = 0.0
    mount_point: str = "/"
    status: str = "optimal"  # optimal (<75%), elevated (75-85%), critical (>85%)


class ComputeVitals(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_memory_bytes: int = 0
    total_memory_mb: float = 0.0
    memory_limit_mb: float = 256.0
    memory_percent: float = 0.0
    cpu_cores_used: float = 0.0
    open_file_descriptors: int = 0
    max_file_descriptors: int = 1048576
    fd_utilization_percent: float = 0.0
    gc_collections: int = 0


class InfrastructureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cluster_mode: bool = False
    deployment_name: str = "simianx-backend"
    namespace: str = "simianx"
    desired_replicas: int = 1
    ready_replicas: int = 1
    available_replicas: int = 1
    updated_replicas: int = 1
    pods: list[PodInfo] = []
    prometheus: PrometheusStatus = PrometheusStatus()
    storage: StorageVitals = StorageVitals()
    compute: ComputeVitals = ComputeVitals()
