export interface ExperimentResult {
  total_requests: number
  successful_requests: number
  failed_requests: number
  achieved_rps: number
  p50_latency_ms: number
  p90_latency_ms: number
  p95_latency_ms: number
  p99_latency_ms: number
  error_rate: number
  status_codes: Record<string, number>
  duration_seconds: number
}

export interface Experiment {
  id: string
  scenario: "traffic_burst"
  duration_seconds: number
  intensity: "low" | "moderate" | "high"
  target_endpoint: string
  status: "queued" | "running" | "completed" | "stopped" | "failed"
  created_at: string
  started_at: string | null
  ended_at: string | null
  results: ExperimentResult
  error_message: string | null
}

export interface MetricsData {
  total_requests: number
  requests_per_second: number
  p50_latency_ms: number
  p90_latency_ms: number
  p95_latency_ms: number
  p99_latency_ms: number
  error_count: number
  error_rate: number
  status_codes: Record<string, number>
  service_status: "healthy" | "degraded" | "unhealthy"
  uptime_seconds: number
  timestamp?: number
  window_requests?: number
  window_errors?: number
  window_error_rate?: number
  window_duration_seconds?: number
}

export interface TimeSeriesPoint {
  timestamp: number
  iso_time: string
  requests: number
  rps: number
  p50_latency_ms: number | null
  p95_latency_ms: number | null
  p99_latency_ms: number | null
  error_count: number
  error_rate: number
}

export interface TimeSeriesResponse {
  points: TimeSeriesPoint[]
  window_seconds: number
  bucket_seconds: number
}

export interface ExperimentCreatePayload {
  scenario: "traffic_burst"
  duration_seconds: number
  intensity: "low" | "moderate" | "high"
}
