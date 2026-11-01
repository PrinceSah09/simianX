import React from "react"
import { X } from "lucide-react"
import type { Experiment } from "../types/experiment"

interface ExperimentResultsCardProps {
  experiment: Experiment | null
  onClose?: () => void
}

export const ExperimentResultsCard: React.FC<ExperimentResultsCardProps> = ({
  experiment,
  onClose,
}) => {
  if (!experiment || experiment.status === "running" || experiment.status === "queued") {
    return null
  }

  const { results } = experiment
  const cells = [
    ["Achieved rate", results ? String(results.achieved_rps) : "—", "req/s", results ? `${results.total_requests} requests` : ""],
    ["P95 latency", results ? String(results.p95_latency_ms) : "—", "ms", results ? `P50 ${results.p50_latency_ms} · P99 ${results.p99_latency_ms}` : ""],
    ["Error rate", results ? `${results.error_rate}%` : "0%", "", results ? `${results.failed_requests} failed` : ""],
    ["Runtime", results ? String(results.duration_seconds) : String(experiment.duration_seconds), "s", `Target ${experiment.duration_seconds}s`],
  ]

  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <div className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            Experiment Results (Expanded View)
          </span>
          <h3 className="mt-0.5 text-[28px] sm:text-[36px] font-semibold tracking-[-0.035em] capitalize text-[#1d1d1f]">
            {experiment.scenario.replaceAll("_", " ")}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34c759]/10 px-3 py-1 text-[12px] font-medium capitalize text-[#28a745]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34c759]" />
            {experiment.status}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-[#6e6e73] transition-colors hover:bg-black/[0.08] hover:text-[#1d1d1f]"
              title="Close expanded view"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-black/[0.08] sm:grid-cols-4">
        {cells.map(([label, value, unit, note]) => (
          <div key={label} className="bg-white px-4 py-8 text-center flex flex-col justify-center items-center min-w-0">
            <div className="inline-flex items-baseline justify-center whitespace-nowrap shrink-0 leading-none">
              <span className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.04em] tabular-nums text-[#1d1d1f] whitespace-nowrap">
                {value}
              </span>
              {unit && (
                <span className="ml-1 inline-block whitespace-nowrap text-[13px] sm:text-[15px] font-normal tracking-normal text-[#6e6e73] shrink-0">
                  {unit}
                </span>
              )}
            </div>
            <p className="mt-2 text-[14px] font-medium text-[#1d1d1f] whitespace-nowrap">{label}</p>
            <p className="mt-0.5 text-[12px] text-[#86868b] truncate max-w-full px-1">{note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ExperimentResultsCard
