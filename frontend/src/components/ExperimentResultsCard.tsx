import React from "react"
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
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/80 dark:shadow-xl animate-in fade-in duration-200 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-neutral-850 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              Experiment Run Summary
            </h3>
            <span className="text-slate-300 dark:text-neutral-700">/</span>
            <span className="font-mono text-xs text-slate-500 dark:text-neutral-400">
              {experiment.id.slice(0, 8)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
            Real measurements collected from target endpoint during this experiment run.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
              isSuccess
                ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold"
                : isStopped
                ? "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 font-semibold"
                : "border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-semibold"
            }`}
          >
            {experiment.status}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Achieved Rate */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-neutral-800/80 dark:bg-neutral-900/30">
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Achieved Rate</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {results.achieved_rps}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400">req/s</span>
          </div>
          <span className="mt-1 block text-xs text-slate-400 dark:text-neutral-500">
            target: {experiment.intensity} intensity
          </span>
        </div>

        {/* P95 Latency */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-neutral-800/80 dark:bg-neutral-900/30">
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">P95 Latency</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-cyan-600 dark:text-cyan-400 tabular-nums">
              {results.p95_latency_ms}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400">ms</span>
          </div>
          <span className="mt-1 block text-xs text-slate-400 dark:text-neutral-500">
            p50: {results.p50_latency_ms}ms • p99: {results.p99_latency_ms}ms
          </span>
        </div>

        {/* Total Requests */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-neutral-800/80 dark:bg-neutral-900/30">
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Total Requests</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {results.total_requests}
            </span>
          </div>
          <span className="mt-1 block text-xs text-slate-400 dark:text-neutral-500">
            {results.successful_requests} ok • {results.failed_requests} err
          </span>
        </div>

        {/* Error Rate */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-neutral-800/80 dark:bg-neutral-900/30">
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Error Rate</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold tracking-tight tabular-nums ${
                results.error_rate > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {results.error_rate}%
            </span>
          </div>
          <span className="mt-1 block text-xs text-slate-400 dark:text-neutral-500">
            {results.failed_requests} non-2xx responses
          </span>
        </div>
      </div>
    </div>
  )
}
