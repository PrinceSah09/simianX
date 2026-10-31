import React from "react"
import { AppleRingGauge } from "./AppleRingGauge"
import type { Experiment, MetricsData } from "../types/experiment"

interface TelemetryGaugesProps {
  metrics: MetricsData | null
  isLoading: boolean
  activeExperiment: Experiment | null
  lastUpdated: Date | null
  isStale: boolean
  onRefresh?: () => void
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({
  metrics,
}) => {
  const windowReqs =
    metrics?.window_requests ?? (metrics && metrics.requests_per_second > 0 ? 1 : 0)
  const isWindowIdle = windowReqs === 0 && metrics?.requests_per_second === 0

  // 1. Throughput
  const rpsVal = metrics ? metrics.requests_per_second : 0
  const rpsMax = metrics && metrics.requests_per_second > 40 ? 100 : 60

  // 2. Latency Status & Values
  const p95Val = isWindowIdle ? null : metrics ? metrics.p95_latency_ms : null
  const latencyStatus: "healthy" | "degraded" | "unhealthy" | "idle" = isWindowIdle
    ? "idle"
    : metrics && metrics.p95_latency_ms > 150
    ? "unhealthy"
    : metrics && metrics.p95_latency_ms > 50
    ? "degraded"
    : "healthy"

  // 3. Error Rate
  const errorRateVal = metrics
    ? metrics.window_error_rate ?? metrics.error_rate
    : 0
  const errorStatus: "healthy" | "degraded" | "unhealthy" | "idle" =
    errorRateVal > 15
      ? "unhealthy"
      : errorRateVal > 5
      ? "degraded"
      : isWindowIdle
      ? "idle"
      : "healthy"

  // 4. Availability
  const availabilityVal = metrics
    ? Math.max(0, 100 - (metrics.window_error_rate ?? metrics.error_rate))
    : 100

  return (
    <div className="space-y-4">
      {/* 4-Column Apple Vitals Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Request Throughput */}
        <AppleRingGauge
          label="Throughput"
          value={metrics ? rpsVal : null}
          unit="RPS"
          max={rpsMax}
          color="cyan"
          status={isWindowIdle ? "idle" : "healthy"}
          subtitle="Rolling 10s Window"
          metaValues={[
            { label: "Total", value: String(metrics?.total_requests ?? 0) },
            { label: "Capacity", value: `${rpsMax} RPS` },
          ]}
        />

        {/* 2. P95 Latency */}
        <AppleRingGauge
          label="P95 Latency"
          value={p95Val}
          unit="ms"
          max={200}
          color="purple"
          status={latencyStatus}
          subtitle="SLO Target ≤ 50ms"
          metaValues={[
            { label: "P50", value: `${metrics?.p50_latency_ms ?? 0}ms` },
            { label: "P99", value: `${metrics?.p99_latency_ms ?? 0}ms` },
          ]}
        />

        {/* 3. Error Rate */}
        <AppleRingGauge
          label="Error Rate"
          value={isWindowIdle ? 0 : errorRateVal}
          unit="%"
          max={25}
          color="rose"
          status={errorStatus}
          subtitle="HTTP 4xx / 5xx Errors"
          metaValues={[
            { label: "Errors", value: String(metrics?.error_count ?? 0) },
            { label: "Budget", value: "99.0%" },
          ]}
        />

        {/* 4. Availability */}
        <AppleRingGauge
          label="Availability"
          value={availabilityVal}
          unit="%"
          max={100}
          color="emerald"
          status={availabilityVal < 98 ? "degraded" : "healthy"}
          subtitle="Golden Signal Health"
          metaValues={[
            { label: "Uptime", value: `${Math.round(metrics?.uptime_seconds ?? 0)}s` },
            { label: "SLO", value: "99.9%" },
          ]}
        />
      </div>
    </div>
  )
}
