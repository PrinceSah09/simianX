export interface BackendHealth {
  status: "healthy" | "unhealthy" | "connecting" | "error"
  service?: string
  version?: string
  latency_ms?: number
  timestamp?: string
}
