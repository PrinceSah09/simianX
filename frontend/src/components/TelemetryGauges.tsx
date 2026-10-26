import React from "react"
import { SpeedometerGauge } from "./SpeedometerGauge"
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
  const isDegraded = metrics?.service_status === "degraded"
  const isUnhealthy = metrics?.service_status === "unhealthy"

  const windowReqs = metrics?.window_requests ?? (metrics && metrics.requests_per_second > 0 ? 1 : 0)
  const isWindowIdle = windowReqs === 0 && metrics?.requests_per_second === 0

  // Throughput scale
  const rpsMax = metrics && metrics.requests_per_second > 40 ? 100 : 60

  // Latency scale & status — fixed 500ms max so the needle is always consistent.
  // A dynamic max caused the needle to jump RIGHT when value dropped (e.g. 215/500=43% → 130/200=65%).
  const latencyMax = 500
  const latencyStatus = isWindowIdle
    ? "idle"
    : metrics && metrics.p95_latency_ms > 150
    ? "unhealthy"
    : metrics && metrics.p95_latency_ms > 50
    ? "degraded"
    : "healthy"

  // Error rate status
  const errorRateVal = metrics
    ? metrics.window_error_rate ?? metrics.error_rate
    : 0
  const errorStatus =
    errorRateVal > 15
      ? "unhealthy"
      : errorRateVal > 5
      ? "degraded"
      : isWindowIdle
      ? "idle"
      : "healthy"

  // Availability status
  const availabilityVal = metrics
    ? Math.max(0, 100 - (metrics.window_error_rate ?? metrics.error_rate))
    : 100

  return (
    <div className="space-y-3">
      {/* 4-Column Symmetrical Precision Tachometer Rack */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Request Throughput Speedometer */}
        <SpeedometerGauge
          label="Request Throughput"
          value={metrics ? metrics.requests_per_second : null}
          unit="req/s"
          min={0}
          max={rpsMax}
          status={isWindowIdle ? "idle" : "healthy"}
          measurementWindow="Rolling 10s"
          subtext={isWindowIdle ? "0 req/s • Idle" : `${metrics?.requests_per_second} req/s`}
          emptyLabel="0.0"
        />

        {/* 2. P95 Latency Speedometer */}
        <SpeedometerGauge
          label="P95 Latency"
          value={isWindowIdle ? null : metrics ? metrics.p95_latency_ms : null}
          unit="ms"
          min={0}
          max={latencyMax}
          threshold={50}
          thresholdLabel="SLO ≤ 50ms"
          status={latencyStatus}
          measurementWindow="Window P95"
          subtext={
            isWindowIdle
              ? "No traffic"
              : metrics
              ? `p50: ${metrics.p50_latency_ms}ms`
              : "Duration"
          }
          emptyLabel="—"
        />

        {/* 3. Error Rate Speedometer */}
        <SpeedometerGauge
          label="Error Rate"
          value={isWindowIdle ? 0 : errorRateVal}
          unit="%"
          min={0}
          max={100}
          threshold={5}
          thresholdLabel="Alert > 5%"
          status={errorStatus}
          measurementWindow="HTTP 4xx/5xx"
          subtext={
            isWindowIdle
              ? metrics && ((metrics.error_count ?? 0) > 0 || (metrics.window_errors ?? 0) > 0)
                ? `${metrics.error_count || metrics.window_errors} total fail${(metrics.error_count || metrics.window_errors) === 1 ? "" : "s"}`
                : "0 errors"
              : metrics
              ? `${metrics.window_errors ?? metrics.error_count} fails`
              : "Failures"
          }
          emptyLabel="0.0"
        />

        {/* 4. Fleet Availability Speedometer */}
        <SpeedometerGauge
          label="Fleet Availability"
          value={availabilityVal}
          unit="%"
          min={0}
          max={100}
          threshold={99.5}
          thresholdLabel="SLO ≥ 99.5%"
          status={isUnhealthy ? "unhealthy" : isDegraded ? "degraded" : "healthy"}
          measurementWindow="Cluster SLA"
          subtext={
            metrics
              ? `${metrics.total_requests.toLocaleString()} total reqs`
              : "All Pods Healthy"
          }
          emptyLabel="100.0"
        />
      </div>
    </div>
  )
}
