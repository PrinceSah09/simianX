"""Prometheus and Kubernetes Cluster Client.

Queries Prometheus for cluster-wide aggregated metrics across pods
and queries Kubernetes / Prometheus targets for infrastructure health.
"""

import logging
import math
import os
import time
from pathlib import Path
from typing import Any

import httpx

from app.core.config import settings
from app.schemas.infrastructure import (
    ComputeVitals,
    InfrastructureResponse,
    PodInfo,
    PrometheusStatus,
    StorageVitals,
    TargetInfo,
)

logger = logging.getLogger(__name__)

K8S_TOKEN_PATH = Path("/var/run/secrets/kubernetes.io/serviceaccount/token")
K8S_CA_PATH = Path("/var/run/secrets/kubernetes.io/serviceaccount/ca.crt")
K8S_API_BASE = "https://kubernetes.default.svc"


class PrometheusClusterService:
    def __init__(
        self,
        prometheus_url: str | None = None,
        k8s_api_url: str = K8S_API_BASE,
    ) -> None:
        self.prometheus_url = (prometheus_url or settings.prometheus_url).rstrip("/")
        self.k8s_api_url = k8s_api_url.rstrip("/")
        self._start_time = time.time()
        self._simulated_replicas: int | None = None

    def is_prometheus_reachable(self) -> bool:
        """Check if Prometheus server is online and healthy."""
        try:
            with httpx.Client(timeout=0.8) as client:
                resp = client.get(f"{self.prometheus_url}/-/healthy")
                return resp.status_code == 200
        except Exception:
            return False

    def query_instant(self, query: str) -> list[dict[str, Any]]:
        """Run an instant PromQL query and return results vector."""
        try:
            with httpx.Client(timeout=1.5) as client:
                resp = client.get(
                    f"{self.prometheus_url}/api/v1/query",
                    params={"query": query},
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    return data.get("result", [])
        except Exception as e:
            logger.debug("Prometheus query failed for '%s': %s", query, e)
        return []

    def query_range(
        self, query: str, start: float, end: float, step: str = "1s"
    ) -> list[dict[str, Any]]:
        """Run a range PromQL query and return results matrix."""
        try:
            with httpx.Client(timeout=2.0) as client:
                resp = client.get(
                    f"{self.prometheus_url}/api/v1/query_range",
                    params={
                        "query": query,
                        "start": start,
                        "end": end,
                        "step": step,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    return data.get("result", [])
        except Exception as e:
            logger.debug("Prometheus query_range failed for '%s': %s", query, e)
        return []

    def get_cluster_metrics(self) -> dict[str, Any] | None:
        """Calculate service-wide aggregated metrics across all active pods.

        IMPORTANT: Histogram quantiles are computed on aggregated buckets:
        histogram_quantile(
            0.95,
            sum(rate(simianx_http_request_duration_seconds_bucket[10s])) by (le)
        )
        Do NOT average pod-level P95s.
        """
        if not self.is_prometheus_reachable():
            return None

        # 1. Throughput (RPS)
        rps_result = self.query_instant(
            'sum(rate({__name__=~"(simianx|scalekart)_http_requests_total"}[10s]))'
        )
        rps = 0.0
        if rps_result and rps_result[0].get("value"):
            try:
                val = float(rps_result[0]["value"][1])
                rps = round(val, 2) if not (val != val) else 0.0
            except (ValueError, TypeError):
                rps = 0.0

        # 2. Total requests counter
        total_result = self.query_instant(
            'sum({__name__=~"(simianx|scalekart)_http_requests_total"})'
        )
        total_requests = 0
        if total_result and total_result[0].get("value"):
            try:
                total_requests = int(float(total_result[0]["value"][1]))
            except (ValueError, TypeError):
                total_requests = 0

        # If zero total requests in cluster, return default zeroed snapshot
        if total_requests == 0 and rps == 0.0:
            return None

        # 3. Percentiles from aggregated histogram buckets across all pods
        def get_quantile(q: float) -> float:
            promql = (
                f"histogram_quantile({q:.2f}, sum(rate("
                '{__name__=~"(simianx|scalekart)_http_request_duration_seconds_bucket"}[10s])) by (le)) * 1000'
            )
            res = self.query_instant(promql)
            if res and res[0].get("value"):
                try:
                    val = float(res[0]["value"][1])
                    if val == val and val >= 0:  # Check not NaN
                        return round(val, 2)
                except (ValueError, TypeError):
                    pass
            return 0.0

        p50 = get_quantile(0.50)
        p90 = get_quantile(0.90)
        p95 = get_quantile(0.95)
        p99 = get_quantile(0.99)

        # 4. Error rate (tracks all 4xx client and 5xx server errors)
        err_res = self.query_instant(
            "clamp_min("
            'sum(rate({__name__=~"(simianx|scalekart)_http_requests_total",status_code=~"[45].."}[10s])) '
            '/ sum(rate({__name__=~"(simianx|scalekart)_http_requests_total"}[10s])), 0) * 100'
        )
        error_rate = 0.0
        if err_res and err_res[0].get("value"):
            try:
                val = float(err_res[0]["value"][1])
                if val == val and val >= 0:
                    error_rate = round(val, 2)
            except (ValueError, TypeError):
                error_rate = 0.0

        # 5. Error count
        err_cnt_res = self.query_instant(
            'sum({__name__=~"(simianx|scalekart)_http_requests_total",status_code=~"[45].."})'
        )
        error_count = 0
        if err_cnt_res and err_cnt_res[0].get("value"):
            try:
                error_count = int(float(err_cnt_res[0]["value"][1]))
            except (ValueError, TypeError):
                error_count = 0

        # 6. Status codes map
        status_res = self.query_instant(
            'sum({__name__=~"(simianx|scalekart)_http_requests_total"}) by (status_code)'
        )
        status_codes: dict[str, int] = {}
        for item in status_res:
            sc = item.get("metric", {}).get("status_code")
            if sc and item.get("value"):
                try:
                    status_codes[str(sc)] = int(float(item["value"][1]))
                except (ValueError, TypeError):
                    pass

        return {
            "total_requests": total_requests,
            "requests_per_second": rps,
            "p50_latency_ms": p50,
            "p90_latency_ms": p90,
            "p95_latency_ms": p95,
            "p99_latency_ms": p99,
            "error_count": error_count,
            "error_rate": error_rate,
            "status_codes": status_codes,
            "service_status": "degraded" if error_rate > 5 else "healthy",
            "uptime_seconds": round(
                time.time() - getattr(self, "_start_time", time.time()), 1
            ),
            "timestamp": time.time(),
            "window_requests": total_requests,
            "window_errors": error_count,
            "window_error_rate": error_rate,
            "window_duration_seconds": 10.0,
        }

    def get_cluster_time_series(
        self, window_seconds: int = 60, bucket_seconds: int = 1
    ) -> list[dict[str, Any]] | None:
        """Query Prometheus for cluster-wide time series metrics across all pods.

        Computes aggregate rate and histogram quantiles on raw buckets across
        the entire cluster, perfectly synchronized for all pods.
        """
        if not self.is_prometheus_reachable():
            return None

        now = int(math.floor(time.time()))
        start = now - window_seconds
        step_str = f"{bucket_seconds}s"

        # 1. Query Prometheus range for RPS
        rps_results = self.query_range(
            'sum(rate({__name__=~"(simianx|scalekart)_http_requests_total"}[5s]))',
            start=start,
            end=now,
            step=step_str,
        )
        if not rps_results:
            return None

        rps_map: dict[int, float] = {}
        for item in rps_results[0].get("values", []):
            try:
                t = int(round(float(item[0])))
                val = float(item[1])
                rps_map[t] = round(val, 2) if (val == val and val >= 0) else 0.0
            except (ValueError, TypeError, IndexError):
                pass

        # 2. Query Prometheus range for P95 latency (aggregated raw buckets)
        p95_query = (
            "histogram_quantile(0.95, sum(rate("
            '{__name__=~"(simianx|scalekart)_http_request_duration_seconds_bucket"}[5s])) by (le)) * 1000'
        )
        p95_results = self.query_range(
            p95_query,
            start=start,
            end=now,
            step=step_str,
        )
        p95_map: dict[int, float | None] = {}
        if p95_results:
            for item in p95_results[0].get("values", []):
                try:
                    t = int(round(float(item[0])))
                    val = float(item[1])
                    if val == val and val >= 0:
                        p95_map[t] = round(val, 2)
                    else:
                        p95_map[t] = None
                except (ValueError, TypeError, IndexError):
                    pass

        # 3. Query Prometheus range for Error Rate (4xx and 5xx)
        err_query = (
            "clamp_min("
            'sum(rate({__name__=~"(simianx|scalekart)_http_requests_total",status_code=~"[45].."}[5s])) '
            '/ sum(rate({__name__=~"(simianx|scalekart)_http_requests_total"}[5s])), 0) * 100'
        )
        err_results = self.query_range(
            err_query,
            start=start,
            end=now,
            step=step_str,
        )
        err_map: dict[int, float] = {}
        if err_results:
            for item in err_results[0].get("values", []):
                try:
                    t = int(round(float(item[0])))
                    val = float(item[1])
                    err_map[t] = round(val, 2) if (val == val and val >= 0) else 0.0
                except (ValueError, TypeError, IndexError):
                    pass

        # Build contiguous sorted bucket points
        num_buckets = max(1, window_seconds // bucket_seconds)
        start_aligned = int(math.floor(start / bucket_seconds) * bucket_seconds)
        points: list[dict[str, Any]] = []

        for i in range(num_buckets):
            b_time = start_aligned + (i * bucket_seconds)
            rps_val = rps_map.get(b_time, 0.0)
            p95_val = p95_map.get(b_time, None)
            err_val = err_map.get(b_time, 0.0)

            # If RPS is virtually 0 (< 0.05), mark latency as idle (None)
            if rps_val < 0.05:
                p95_val = None
                rps_val = 0.0

            requests_count = int(round(rps_val * bucket_seconds))
            iso_time = time.strftime("%H:%M:%S", time.gmtime(b_time))

            points.append(
                {
                    "timestamp": float(b_time),
                    "iso_time": iso_time,
                    "requests": requests_count,
                    "rps": rps_val,
                    "p50_latency_ms": p95_val,
                    "p95_latency_ms": p95_val,
                    "p99_latency_ms": p95_val,
                    "error_count": 0,
                    "error_rate": err_val,
                }
            )

        return points

    def get_infrastructure_state(
        self, namespace: str = "simianx"
    ) -> InfrastructureResponse:
        """Fetch real Kubernetes deployment and pod metadata along with
        Prometheus targets.
        """
        cluster_mode = False
        desired = 1
        ready = 1
        available = 1
        updated = 1
        pods_list: list[PodInfo] = []

        # 1. Query Kubernetes in-cluster API if service account token exists
        actual_namespace = os.getenv("POD_NAMESPACE") or namespace
        actual_dep_name = "simianx-backend"

        # Check if local Kind Kubernetes bridge is active when running outside a pod
        if not K8S_TOKEN_PATH.exists():
            for host in ["host.docker.internal", "127.0.0.1", "localhost"]:
                try:
                    with httpx.Client(timeout=1.0) as bridge_client:
                        b_resp = bridge_client.get(
                            f"http://{host}:30080/api/v1/infrastructure",
                            params={"namespace": actual_namespace},
                        )
                        if b_resp.status_code == 200:
                            data = b_resp.json()
                            if data.get("cluster_mode"):
                                return InfrastructureResponse.model_validate(data)
                except Exception:
                    continue

        if K8S_TOKEN_PATH.exists():
            try:
                token = K8S_TOKEN_PATH.read_text().strip()
                headers = {"Authorization": f"Bearer {token}"}
                verify = str(K8S_CA_PATH) if K8S_CA_PATH.exists() else False

                with httpx.Client(
                    headers=headers, verify=verify, timeout=2.0
                ) as k8s_client:
                    # Discover deployment (supports simianx-backend or scalekart-backend)
                    for dep in ["simianx-backend", "scalekart-backend"]:
                        dep_resp = k8s_client.get(
                            f"{self.k8s_api_url}/apis/apps/v1/namespaces/{actual_namespace}/deployments/{dep}"
                        )
                        if dep_resp.status_code == 200:
                            actual_dep_name = dep
                            cluster_mode = True
                            dep_data = dep_resp.json()
                            spec = dep_data.get("spec", {})
                            status = dep_data.get("status", {})
                            desired = spec.get("replicas", 1)
                            ready = status.get("readyReplicas", 0)
                            available = status.get("availableReplicas", 0)
                            updated = status.get("updatedReplicas", 0)
                            break

                    # Get pods matching deployment
                    pods_resp = k8s_client.get(
                        f"{self.k8s_api_url}/api/v1/namespaces/{actual_namespace}/pods",
                        params={"labelSelector": f"app={actual_dep_name}"},
                    )
                    if pods_resp.status_code != 200 or not pods_resp.json().get(
                        "items"
                    ):
                        # Fallback query all pods in namespace
                        pods_resp = k8s_client.get(
                            f"{self.k8s_api_url}/api/v1/namespaces/{actual_namespace}/pods",
                        )
                    if pods_resp.status_code == 200:
                        cluster_mode = True
                        for item in pods_resp.json().get("items", []):
                            metadata = item.get("metadata", {})
                            pod_status = item.get("status", {})
                            container_statuses = pod_status.get("containerStatuses", [])
                            restarts = sum(
                                cs.get("restartCount", 0) for cs in container_statuses
                            )
                            is_ready = any(
                                cond.get("type") == "Ready"
                                and cond.get("status") == "True"
                                for cond in pod_status.get("conditions", [])
                            )

                            pods_list.append(
                                PodInfo(
                                    name=metadata.get("name", "unknown"),
                                    node=item.get("spec", {}).get("nodeName"),
                                    ip=pod_status.get("podIP"),
                                    phase=pod_status.get("phase", "Unknown"),
                                    ready=is_ready,
                                    restarts=restarts,
                                    started_at=pod_status.get("startTime"),
                                )
                            )
            except Exception as e:
                logger.warning("Failed querying Kubernetes in-cluster API: %s", e)

        # 2. Query Prometheus targets for discovery health
        prom_status = PrometheusStatus(
            connected=False,
            url=self.prometheus_url,
            active_targets_count=0,
            healthy_targets_count=0,
            targets=[],
        )

        try:
            with httpx.Client(timeout=1.5) as client:
                t_resp = client.get(f"{self.prometheus_url}/api/v1/targets")
                if t_resp.status_code == 200:
                    prom_status.connected = True
                    targets_data = (
                        t_resp.json().get("data", {}).get("activeTargets", [])
                    )
                    t_list: list[TargetInfo] = []
                    healthy_count = 0
                    for t in targets_data:
                        labels = t.get("labels", {})
                        health = t.get("health", "unknown")
                        if health == "up":
                            healthy_count += 1
                        t_list.append(
                            TargetInfo(
                                pod_name=labels.get(
                                    "kubernetes_pod_name",
                                    labels.get("instance", "unknown"),
                                ),
                                instance=t.get("scrapeUrl", ""),
                                health=health,
                                last_scrape=t.get("lastScrape"),
                                scrape_duration_ms=round(
                                    float(t.get("lastScrapeDuration", 0.0)) * 1000,
                                    2,
                                ),
                            )
                        )
                    prom_status.active_targets_count = len(t_list)
                    prom_status.healthy_targets_count = healthy_count
                    prom_status.targets = t_list

                    # If not in k8s, synthesize pod info from discovered targets
                    if not cluster_mode and t_list:
                        cluster_mode = True
                        desired = len(t_list)
                        ready = healthy_count
                        available = healthy_count
                        updated = healthy_count
                        if not pods_list:
                            for ti in t_list:
                                pods_list.append(
                                    PodInfo(
                                        name=ti.pod_name,
                                        node="kind-node",
                                        ip=ti.instance.split(":")[1].replace("//", "")
                                        if ":" in ti.instance
                                        else None,
                                        phase="Running"
                                        if ti.health == "up"
                                        else "Unhealthy",
                                        ready=(ti.health == "up"),
                                        restarts=0,
                                        started_at=ti.last_scrape,
                                    )
                                )
        except Exception as e:
            logger.debug("Failed querying Prometheus targets: %s", e)

        # 3. Real container storage / disk vitals
        import shutil

        storage_vitals = StorageVitals()
        try:
            total_b, used_b, free_b = shutil.disk_usage("/")
            pct = round((used_b / total_b * 100.0), 1) if total_b > 0 else 0.0
            total_g = round(total_b / (1024**3), 1)
            used_g = round(used_b / (1024**3), 1)
            free_g = round(free_b / (1024**3), 1)
            st = "critical" if pct > 85 else "elevated" if pct > 75 else "optimal"
            storage_vitals = StorageVitals(
                total_bytes=total_b,
                used_bytes=used_b,
                free_bytes=free_b,
                used_percent=pct,
                total_gb=total_g,
                used_gb=used_g,
                free_gb=free_g,
                mount_point="/",
                status=st,
            )
        except Exception as e:
            logger.debug("Failed checking disk usage: %s", e)

        # 4. Compute & SRE Runtime Vitals from Prometheus
        compute_vitals = ComputeVitals()
        pod_memory_map: dict[str, float] = {}
        pod_fds_map: dict[str, int] = {}

        if prom_status.connected:
            try:
                # Per-pod and cluster memory
                mem_results = self.query_instant("process_resident_memory_bytes")
                total_mem_bytes = 0
                for m in mem_results:
                    val_str = m.get("value", [0, 0])[1]
                    try:
                        b = int(float(val_str))
                        total_mem_bytes += b
                        mb = round(b / (1024 * 1024), 1)
                        pod_name = m.get("metric", {}).get("kubernetes_pod_name")
                        if pod_name:
                            pod_memory_map[pod_name] = mb
                    except (ValueError, TypeError):
                        pass

                # Per-pod and cluster open file descriptors
                fds_results = self.query_instant("process_open_fds")
                total_fds = 0
                for f in fds_results:
                    val_str = f.get("value", [0, 0])[1]
                    try:
                        n = int(float(val_str))
                        total_fds += n
                        pod_name = f.get("metric", {}).get("kubernetes_pod_name")
                        if pod_name:
                            pod_fds_map[pod_name] = n
                    except (ValueError, TypeError):
                        pass

                # Max FDs
                max_fds = 1048576
                max_fds_res = self.query_instant("max(process_max_fds)")
                if max_fds_res and max_fds_res[0].get("value"):
                    try:
                        max_fds = int(float(max_fds_res[0]["value"][1]))
                    except (ValueError, TypeError):
                        pass

                # GC collections
                gc_total = 0
                gc_res = self.query_instant("sum(python_gc_collections_total)")
                if gc_res and gc_res[0].get("value"):
                    try:
                        gc_total = int(float(gc_res[0]["value"][1]))
                    except (ValueError, TypeError):
                        pass

                # CPU millicores rate
                cpu_cores = 0.0
                cpu_res = self.query_instant(
                    "sum(rate(process_cpu_seconds_total[30s])) * 1000"
                )
                if cpu_res and cpu_res[0].get("value"):
                    try:
                        cpu_cores = round(float(cpu_res[0]["value"][1]), 1)
                    except (ValueError, TypeError):
                        pass

                total_mem_mb = round(total_mem_bytes / (1024 * 1024), 1)
                cluster_mem_limit = max(256.0, float(ready or desired or 1) * 256.0)
                mem_pct = round((total_mem_mb / cluster_mem_limit) * 100.0, 1)
                fd_pct = round((total_fds / max(1, max_fds)) * 100.0, 4)

                compute_vitals = ComputeVitals(
                    total_memory_bytes=total_mem_bytes,
                    total_memory_mb=total_mem_mb,
                    memory_limit_mb=cluster_mem_limit,
                    memory_percent=mem_pct,
                    cpu_cores_used=cpu_cores,
                    open_file_descriptors=total_fds,
                    max_file_descriptors=max_fds,
                    fd_utilization_percent=fd_pct,
                    gc_collections=gc_total,
                )
            except Exception as e:
                logger.debug("Failed querying compute vitals from Prometheus: %s", e)

        # Fallback if standalone local dev (neither k8s nor Prometheus active targets)
        if not cluster_mode and not pods_list:
            hostname = os.environ.get("HOSTNAME", "local-dev-process")
            pods_list.append(
                PodInfo(
                    name=hostname,
                    node="localhost",
                    ip="127.0.0.1",
                    phase="Running",
                    ready=True,
                    restarts=0,
                    started_at=None,
                )
            )

        # Enrich pods with per-pod memory and open FDs
        for p in pods_list:
            if p.name in pod_memory_map:
                p.memory_mb = pod_memory_map[p.name]
            if p.name in pod_fds_map:
                p.open_fds = pod_fds_map[p.name]

        return InfrastructureResponse(
            cluster_mode=cluster_mode,
            deployment_name=actual_dep_name,
            namespace=actual_namespace,
            desired_replicas=desired,
            ready_replicas=ready,
            available_replicas=available,
            updated_replicas=updated,
            pods=pods_list,
            prometheus=prom_status,
            storage=storage_vitals,
            compute=compute_vitals,
        )

    def scale_deployment(self, replicas: int, namespace: str = "simianx") -> bool:
        """Manually scale backend deployment via Kubernetes API or local bridge."""
        if not (1 <= replicas <= 20):
            raise ValueError("Replicas must be between 1 and 20.")

        actual_namespace = os.getenv("POD_NAMESPACE") or namespace

        # 1. In-cluster scaling via Kubernetes ServiceAccount token
        if K8S_TOKEN_PATH.exists():
            try:
                token = K8S_TOKEN_PATH.read_text().strip()
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/strategic-merge-patch+json",
                }
                verify = str(K8S_CA_PATH) if K8S_CA_PATH.exists() else False
                with httpx.Client(
                    headers=headers, verify=verify, timeout=3.0
                ) as client:
                    for dep in ["simianx-backend", "scalekart-backend"]:
                        url = f"{self.k8s_api_url}/apis/apps/v1/namespaces/{actual_namespace}/deployments/{dep}"
                        resp = client.patch(
                            url,
                            json={"spec": {"replicas": replicas}},
                        )
                        if resp.status_code == 200:
                            return True
            except Exception as e:
                logger.error(
                    "Failed scaling deployment to %d replicas: %s", replicas, e
                )

        # 2. Local Kind Kubernetes bridge (when running in Docker Compose or standalone)
        for host in ["host.docker.internal", "127.0.0.1", "localhost"]:
            try:
                with httpx.Client(timeout=2.0) as bridge_client:
                    b_resp = bridge_client.post(
                        f"http://{host}:30080/api/v1/infrastructure/scale",
                        params={"replicas": replicas, "namespace": actual_namespace},
                    )
                    if b_resp.status_code == 200:
                        logger.info("Scaled local Kubernetes cluster via bridge at %s:30080", host)
                        return True
            except Exception:
                continue

        # 3. Standalone simulated scale fallback
        self._simulated_replicas = replicas
        logger.info("Updated standalone simulated replicas: %d", replicas)
        return True


cluster_service = PrometheusClusterService()
