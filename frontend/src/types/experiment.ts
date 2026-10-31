export type ScenarioType =
  | "traffic_burst"
  | "latency_spike"
  | "error_spike"
  | "memory_saturation"

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
  scenario: ScenarioType
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

export interface ChaosScenarioInfo {
  id: ScenarioType
  name: string
  description: string
  category: string
  default_duration: number
  intensities: ("low" | "moderate" | "high")[]
  target_metric: string
  slo_impact: string
}

export interface SpanDetail {
  span_id: string
  trace_id: string
  name: string
  parent_id: string | null
  start_time: string
  end_time: string
  duration_ms: number
  status: string
  attributes: Record<string, any>
}

export interface TraceSummaryItem {
  trace_id: string
  root_name: string
  span_count: number
  start_time: string
  duration_ms: number
  status: "OK" | "ERROR"
  status_code: number
  scenario: string
}

export interface TraceDetail {
  trace_id: string
  root_name: string
  start_time: string
  duration_ms: number
  status: "OK" | "ERROR"
  spans: SpanDetail[]
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
  scenario: ScenarioType
  duration_seconds: number
  intensity: "low" | "moderate" | "high"
}
