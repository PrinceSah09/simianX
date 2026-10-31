import React from "react"
import { ActivityRings, Donut } from "./ActivityRings"
import type { Experiment, MetricsData } from "../types/experiment"

interface TelemetryGaugesProps {
  metrics: MetricsData | null
  isLoading: boolean
  activeExperiment: Experiment | null
  lastUpdated: Date | null
  isStale: boolean
  onRefresh?: () => void
}

function formatMetric(value: number | null) {
  if (value === null) return "0"
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({
  metrics,
  activeExperiment,
  isStale,
}) => {
  const windowReqs =
    metrics?.window_requests ?? (metrics && metrics.requests_per_second > 0 ? 1 : 0)
  const isWindowIdle = windowReqs === 0 && metrics?.requests_per_second === 0

  const rpsVal = metrics ? metrics.requests_per_second : 0
  const rpsMax = metrics && metrics.requests_per_second > 40 ? 100 : 60

  const p95Val = isWindowIdle ? null : metrics ? metrics.p95_latency_ms : null
  const latencyStatus: "healthy" | "degraded" | "unhealthy" | "idle" = isWindowIdle
    ? "idle"
    : metrics && metrics.p95_latency_ms > 150
    ? "unhealthy"
    : metrics && metrics.p95_latency_ms > 50
    ? "degraded"
    : "healthy"

  const errorRateVal = metrics ? metrics.window_error_rate ?? metrics.error_rate : 0
  const errorStatus: "healthy" | "degraded" | "unhealthy" | "idle" =
    errorRateVal > 15 ? "unhealthy" : errorRateVal > 5 ? "degraded" : isWindowIdle ? "idle" : "healthy"

  const availabilityVal = metrics
    ? Math.max(0, 100 - (metrics.window_error_rate ?? metrics.error_rate))
    : 0

  const latencyHealth = p95Val === null ? 0 : Math.max(0, 100 - (p95Val / 200) * 100)
  const isRunning = activeExperiment?.status === "running"
  const scenarioName = activeExperiment?.scenario.replaceAll("_", " ")

  const latencyColor =
    latencyStatus === "unhealthy" ? "#ff3b30" : latencyStatus === "degraded" ? "#ff9f0a" : "#5e5ce6"
  const errorColor = errorStatus === "unhealthy" || errorStatus === "degraded" ? "#ff3b30" : "#ff375f"

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-[28px] bg-white">
        <div className="flex flex-col items-center gap-8 px-8 py-10 sm:flex-row sm:justify-between sm:px-12 sm:py-12">
          <div className="max-w-[440px] text-center sm:text-left">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
              {isRunning ? "Simulation live" : "Simulation"}
            </p>
            <h2 className="mt-2 text-[34px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[44px]">
              {isRunning ? "In flight." : isStale && metrics ? "Signal lost." : "Standing by."}
            </h2>
            <p className="mt-3 text-[17px] leading-snug text-[#6e6e73]">
              {isRunning
                ? `${scenarioName} is moving load through the cluster. The rings follow throughput, latency, and availability.`
                : "Three rings for the run. Throughput, latency headroom, and availability update as the simulation moves."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-[#6e6e73] sm:justify-start">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#30d158]" />
                Availability
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0071e3]" />
                Throughput
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#5e5ce6]" />
                Latency
              </span>
            </div>
          </div>

          <ActivityRings
            size={210}
            stroke={16}
            gap={8}
            rings={[
              { value: availabilityVal, max: 100, color: "#30d158" },
              { value: rpsVal, max: rpsMax, color: "#0071e3" },
              { value: latencyHealth, max: 100, color: "#5e5ce6" },
            ]}
            center={
              <div>
                <p className="text-[13px] text-[#86868b]">{isRunning ? "Live" : "Idle"}</p>
                <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                  {formatMetric(metrics ? rpsVal : null)}
                </p>
                <p className="mt-1 text-[12px] text-[#86868b]">req/s</p>
              </div>
            }
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] bg-black/[0.08] lg:grid-cols-4">
        <Donut
          label="Throughput"
          display={formatMetric(metrics ? rpsVal : null)}
          unit="req/s"
          caption={`${metrics?.total_requests ?? 0} requests`}
          value={rpsVal}
          max={rpsMax}
          color="#0071e3"
        />
        <Donut
          label="P95 latency"
          display={formatMetric(p95Val)}
          unit="ms"
          caption={`P50 ${metrics?.p50_latency_ms ?? 0} · P99 ${metrics?.p99_latency_ms ?? 0}`}
          value={p95Val ?? 0}
          max={200}
          color={latencyColor}
        />
        <Donut
          label="Error rate"
          display={formatMetric(isWindowIdle ? 0 : errorRateVal)}
          unit="percent"
          caption={`${metrics?.error_count ?? 0} failed`}
          value={isWindowIdle ? 0 : errorRateVal}
          max={25}
          color={errorColor}
        />
        <Donut
          label="Availability"
          display={formatMetric(availabilityVal)}
          unit="percent"
          caption={`${Math.round(metrics?.uptime_seconds ?? 0)}s uptime`}
          value={availabilityVal}
          max={100}
          color="#30d158"
        />
      </div>
    </div>
  )
}
