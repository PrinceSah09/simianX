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
    <div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[28px] bg-black/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Request Throughput */}
        <AppleRingGauge
          label="Throughput"
          value={metrics ? rpsVal : null}
          unit="RPS"
          max={rpsMax}
          color="cyan"
          status={isWindowIdle ? "idle" : "healthy"}
          subtitle={`${metrics?.total_requests ?? 0} requests`}
          metaValues={undefined}
        />

        {/* 2. P95 Latency */}
        <AppleRingGauge
          label="P95 Latency"
          value={p95Val}
          unit="ms"
          max={200}
          color="purple"
          status={latencyStatus}
          subtitle={`P50 ${metrics?.p50_latency_ms ?? 0} · P99 ${metrics?.p99_latency_ms ?? 0}`}
          metaValues={undefined}
        />

        {/* 3. Error Rate */}
        <AppleRingGauge
          label="Error Rate"
          value={isWindowIdle ? 0 : errorRateVal}
          unit="%"
          max={25}
          color="rose"
          status={errorStatus}
          subtitle={`${metrics?.error_count ?? 0} failed requests`}
          metaValues={undefined}
        />

        {/* 4. Availability */}
        <AppleRingGauge
          label="Availability"
          value={availabilityVal}
          unit="%"
          max={100}
          color="emerald"
          status={availabilityVal < 98 ? "degraded" : "healthy"}
          subtitle={`${Math.round(metrics?.uptime_seconds ?? 0)}s uptime`}
          metaValues={undefined}
        />
      </div>
    </div>
  )
}
