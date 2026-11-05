import type {
  ChaosScenarioInfo,
  Experiment,
  ExperimentCreatePayload,
  MetricsData,
  TimeSeriesResponse,
  TraceDetail,
  TraceSummaryItem,
} from "../types/experiment"
import type { BackendHealth } from "../types/health"
import type { LogEntry } from "../types/telemetry"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

export async function fetchHealth(): Promise<BackendHealth> {
  const startTime = performance.now()
  try {
    const res = await fetch(`${BASE_URL}/health`, { method: "GET" })
    const latency_ms = Math.round(performance.now() - startTime)
    if (!res.ok) {
      return { status: "unhealthy", latency_ms }
    }
    const data = await res.json()
    return {
      status: "healthy",
      service: data.service,
      version: data.version,
      latency_ms,
    }
  } catch {
    return {
      status: "error",
      latency_ms: Math.round(performance.now() - startTime),
    }
  }
}

export async function fetchMetrics(): Promise<MetricsData> {
  const res = await fetch(`${BASE_URL}/api/v1/metrics`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch metrics: HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchMetricsSeries(
  windowSeconds: number = 60,
  bucketSeconds: number = 1
): Promise<TimeSeriesResponse> {
  const res = await fetch(
    `${BASE_URL}/api/v1/metrics/series?window_seconds=${windowSeconds}&bucket_seconds=${bucketSeconds}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  )
  if (!res.ok) {
    throw new Error(`Failed to fetch metrics series: HTTP ${res.status}`)
  }
  return res.json()
}

export async function listExperiments(limit: number = 10): Promise<{ items: Experiment[]; total: number }> {
  const res = await fetch(`${BASE_URL}/api/v1/experiments?limit=${limit}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to list experiments: HTTP ${res.status}`)
  }
  return res.json()
}

export async function createExperiment(payload: ExperimentCreatePayload): Promise<Experiment> {
  const res = await fetch(`${BASE_URL}/api/v1/experiments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (res.status === 409) {
    const errorBody = await res.json()
    throw new Error(errorBody.detail || "An experiment is already in progress.")
  }
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Failed to create experiment: HTTP ${res.status}`)
  }
  return res.json()
}

export async function getExperiment(id: string): Promise<Experiment> {
  const res = await fetch(`${BASE_URL}/api/v1/experiments/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to get experiment: HTTP ${res.status}`)
  }
  return res.json()
}

export async function stopExperiment(id: string): Promise<Experiment> {
  const res = await fetch(`${BASE_URL}/api/v1/experiments/${id}/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to stop experiment: HTTP ${res.status}`)
  }
  return res.json()
}

export async function pingTestTarget(): Promise<{ durationMs: number; status: number }> {
  const start = performance.now()
  try {
    const res = await fetch(`${BASE_URL}/api/v1/test-target`)
    const durationMs = Math.round(performance.now() - start)
    return { durationMs, status: res.status }
  } catch {
    const durationMs = Math.round(performance.now() - start)
    return { durationMs, status: 503 }
  }
}

export async function fetchInfrastructure(namespace: string = "simianx"): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/infrastructure?namespace=${namespace}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch infrastructure: HTTP ${res.status}`)
  }
  return res.json()
}

export async function scaleDeployment(
  replicas: number,
  namespace: string = "simianx"
): Promise<any> {
  const res = await fetch(
    `${BASE_URL}/api/v1/infrastructure/scale?replicas=${replicas}&namespace=${namespace}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to scale deployment: HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchChaosScenarios(): Promise<ChaosScenarioInfo[]> {
  const res = await fetch(`${BASE_URL}/api/v1/chaos/scenarios`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch chaos scenarios: HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.scenarios
}

export async function fetchTraces(limit: number = 30): Promise<TraceSummaryItem[]> {
  const res = await fetch(`${BASE_URL}/api/v1/traces?limit=${limit}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch traces: HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.traces
}

export async function fetchTraceDetail(traceId: string): Promise<TraceDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/traces/${traceId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch trace detail for ${traceId}: HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchLiveLogs(options?: number | {
  limit?: number
  level?: string
  status_code?: number
  min_duration_ms?: number
  search?: string
}): Promise<{ items: LogEntry[]; total: number }> {
  const opts = typeof options === "number" ? { limit: options } : options
  const params = new URLSearchParams()
  params.set("limit", String(opts?.limit ?? 300))
  if (opts?.level) params.set("level", opts.level)
  if (opts?.status_code) params.set("status_code", String(opts.status_code))
  if (opts?.min_duration_ms) params.set("min_duration_ms", String(opts.min_duration_ms))
  if (opts?.search) params.set("search", opts.search)

  const res = await fetch(`${BASE_URL}/api/v1/logs?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch live logs: HTTP ${res.status}`)
  }
  return res.json()
}

export async function clearLiveLogs(): Promise<void> {
  await fetch(`${BASE_URL}/api/v1/logs`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  })
}

export interface SlackAlertsStatus {
  enabled: boolean
  configured: boolean
  webhook_masked: string | null
  channel: string
  cooldown_seconds: number
  error_threshold_pct: number
  latency_threshold_ms: number
  is_firing: boolean
  active_incident: {
    type: string | null
    duration_seconds: number
    started_at: string | null
  } | null
  recent_alerts: Array<{
    timestamp: string
    type: string
    severity: string
    status: string
    message: string
  }>
}

export async function fetchAlertsStatus(): Promise<SlackAlertsStatus> {
  const res = await fetch(`${BASE_URL}/api/v1/alerts/status`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts status: HTTP ${res.status}`)
  }
  return res.json()
}

export async function updateAlertsConfig(config: {
  webhook_url?: string
  channel?: string
  enabled?: boolean
  cooldown_seconds?: number
  error_threshold_pct?: number
  latency_threshold_ms?: number
}): Promise<SlackAlertsStatus> {
  const res = await fetch(`${BASE_URL}/api/v1/alerts/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  })
  if (!res.ok) {
    throw new Error(`Failed to update alerts config: HTTP ${res.status}`)
  }
  return res.json()
}

export async function sendTestSlackAlert(webhook_url?: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/alerts/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webhook_url }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Slack test failed: HTTP ${res.status}`)
  }
  return res.json()
}



