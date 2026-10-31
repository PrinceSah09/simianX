import React from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { Experiment } from "../types/experiment"

interface ExperimentResultsCardProps {
  experiment: Experiment | null
}

export const ExperimentResultsCard: React.FC<ExperimentResultsCardProps> = ({
  experiment,
}) => {
  if (!experiment || experiment.status === "running" || experiment.status === "queued") {
    return null
  }

  const { results } = experiment
  const isSuccess = experiment.status === "completed"
  const isStopped = experiment.status === "stopped"

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-950/70 p-5 sm:p-6 border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all space-y-4">
      {/* Specular Top Edge Light Refraction */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-white font-sans">
              Reliability Experiment Outcome
            </h3>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-xs text-zinc-400">
              {experiment.id.slice(0, 8)}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Real telemetry observations recorded during this run ({experiment.scenario} at {experiment.intensity} intensity).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-mono font-medium border flex items-center gap-1.5 ${
              isSuccess
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold"
                : isStopped
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            <span className="uppercase">{experiment.status}</span>
          </span>
        </div>
      </div>

      {/* 4-Column Apple Results Metric Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Achieved Rate */}
        <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Achieved Rate
          </span>
          <div className="mt-1.5 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">
              {results.achieved_rps}
            </span>
            <span className="text-xs text-zinc-500">req/s</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Total {results.total_requests} requests
          </p>
        </div>

        {/* P95 Latency */}
        <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            P95 Latency
          </span>
          <div className="mt-1.5 flex items-baseline gap-1 font-mono">
            <span
              className={`text-2xl font-semibold tracking-tight tabular-nums ${
                results.p95_latency_ms > 100
                  ? "text-rose-400"
                  : results.p95_latency_ms > 50
                  ? "text-amber-400"
                  : "text-white"
              }`}
            >
              {results.p95_latency_ms}
            </span>
            <span className="text-xs text-zinc-500">ms</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            P50: {results.p50_latency_ms}ms • P99: {results.p99_latency_ms}ms
          </p>
        </div>

        {/* Error Rate */}
        <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Observed Errors
          </span>
          <div className="mt-1.5 flex items-baseline gap-1 font-mono">
            <span
              className={`text-2xl font-semibold tracking-tight tabular-nums ${
                results.error_rate > 5 ? "text-rose-400" : "text-white"
              }`}
            >
              {results.error_rate}%
            </span>
            <span className="text-xs text-zinc-500">rate</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            {results.failed_requests} failed / {results.successful_requests} ok
          </p>
        </div>

        {/* Duration */}
        <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Actual Runtime
          </span>
          <div className="mt-1.5 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">
              {results.duration_seconds}
            </span>
            <span className="text-xs text-zinc-500">seconds</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Target duration: {experiment.duration_seconds}s
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExperimentResultsCard
