export interface PodInfo {
  name: string
  node?: string | null
  ip?: string | null
  phase: string
  ready: boolean
  restarts: number
  started_at?: string | null
  memory_mb?: number | null
  open_fds?: number | null
}

export interface TargetInfo {
  pod_name: string
  instance: string
  health: string
  last_scrape?: string | null
  scrape_duration_ms: number
}

export interface PrometheusStatus {
  connected: boolean
  url: string
  active_targets_count: number
  healthy_targets_count: number
  targets: TargetInfo[]
}

export interface StorageVitals {
  total_bytes: number
  used_bytes: number
  free_bytes: number
  used_percent: number
  total_gb: number
  used_gb: number
  free_gb: number
  mount_point: string
  status: "optimal" | "elevated" | "critical"
}

export interface ComputeVitals {
  total_memory_bytes: number
  total_memory_mb: number
  memory_limit_mb: number
  memory_percent: number
  cpu_cores_used: number
  open_file_descriptors: number
  max_file_descriptors: number
  fd_utilization_percent: number
  gc_collections: number
}

export interface InfrastructureData {
  cluster_mode: boolean
  deployment_name: string
  namespace: string
  desired_replicas: number
  ready_replicas: number
  available_replicas: number
  updated_replicas: number
  pods: PodInfo[]
  prometheus: PrometheusStatus
  storage?: StorageVitals
  compute?: ComputeVitals
}
