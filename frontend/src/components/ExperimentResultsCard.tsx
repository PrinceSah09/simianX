import React from "react"
import type { Experiment } from "../types/experiment"

interface ExperimentResultsCardProps {
  experiment: Experiment | null
}

export const ExperimentResultsCard: React.FC<ExperimentResultsCardProps> = ({ experiment }) => {
  if (!experiment || experiment.status === "running" || experiment.status === "queued") {
    return null
  }

  const { results } = experiment
  const cells = [
    ["Achieved rate", String(results.achieved_rps), "req/s", `${results.total_requests} requests`],
    ["P95 latency", String(results.p95_latency_ms), "ms", `P50 ${results.p50_latency_ms} · P99 ${results.p99_latency_ms}`],
    ["Error rate", `${results.error_rate}%`, "", `${results.failed_requests} failed`],
    ["Runtime", String(results.duration_seconds), "s", `Target ${experiment.duration_seconds}s`],
  ]

  return (
    <section className="overflow-hidden rounded-[28px] bg-white">
      <div className="flex flex-col gap-1 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <h3 className="text-[32px] font-semibold tracking-[-0.035em] capitalize sm:text-[40px]">
          {experiment.scenario.replaceAll("_", " ")}
        </h3>
        <p className="text-[17px] capitalize text-[#0066cc]">{experiment.status}</p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-black/[0.08] sm:grid-cols-4">
        {cells.map(([label, value, unit, note]) => (
          <div key={label} className="bg-white px-6 py-10 text-center">
            <p className="text-[36px] font-semibold leading-none tracking-[-0.045em] tabular-nums sm:text-[44px]">
              {value}
              {unit && <span className="ml-1 text-[15px] font-normal tracking-normal text-[#6e6e73]">{unit}</span>}
            </p>
            <p className="mt-2 text-[14px] text-[#1d1d1f]">{label}</p>
            <p className="mt-0.5 text-[12px] text-[#86868b]">{note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ExperimentResultsCard
