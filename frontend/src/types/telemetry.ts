export interface LogEntry {
  id: string
  timestamp: string
  level: "INFO" | "WARN" | "DEBUG" | "ERROR"
  endpoint: string
  status: number
  durationMs: number
  traceId: string
  message: string
}

export interface LatencyMetric {
  id: number
  durationMs: number
  status: number
}
