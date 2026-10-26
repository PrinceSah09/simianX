import type {
  Experiment,
  ExperimentCreatePayload,
  MetricsData,
  TimeSeriesResponse,
} from "../types/experiment"
import type { BackendHealth } from "../types/health"

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

