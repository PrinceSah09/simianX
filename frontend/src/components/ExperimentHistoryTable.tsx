import React from "react"
import { RefreshCw } from "lucide-react"
import type { Experiment } from "../types/experiment"

interface ExperimentHistoryTableProps {
  experiments: Experiment[]
  selectedExperimentId: string | null
  onSelectExperiment: (experiment: Experiment) => void
  onRefresh: () => void
  isLoading: boolean
}

export const ExperimentHistoryTable: React.FC<ExperimentHistoryTableProps> = ({
  experiments,
  selectedExperimentId,
  onSelectExperiment,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/80 dark:shadow-xl transition-all">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-850 pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            Recent Experiments History
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
            Audit trail of controlled reliability experiments executed on this cluster.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:text-white transition disabled:opacity-50 shadow-2xs"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        {experiments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-neutral-500">
            No experiments recorded yet. Launch an experiment above to view telemetry results.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-neutral-850 text-xs text-slate-500 dark:text-neutral-400">
                <th className="pb-2.5 font-medium">Experiment ID</th>
                <th className="pb-2.5 font-medium">Scenario</th>
                <th className="pb-2.5 font-medium">Intensity</th>
                <th className="pb-2.5 font-medium">Duration</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium text-right">Achieved RPS</th>
                <th className="pb-2.5 font-medium text-right">P95 Latency</th>
                <th className="pb-2.5 font-medium text-right">Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-850">
              {experiments.map((exp) => {
                const isSelected = selectedExperimentId === exp.id
                return (
                  <tr
                    key={exp.id}
                    onClick={() => onSelectExperiment(exp)}
                    className={`cursor-pointer transition hover:bg-slate-50 dark:hover:bg-neutral-900/60 ${
                      isSelected
                        ? "bg-slate-100 text-slate-950 font-semibold dark:bg-neutral-900 dark:text-white"
                        : "text-slate-700 dark:text-neutral-300"
                    }`}
                  >
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                      {exp.id.slice(0, 8)}...
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-neutral-400">{exp.scenario}</td>
                    <td className="py-2.5">
                      <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                        {exp.intensity}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-neutral-400">{exp.duration_seconds}s</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-semibold ${
                          exp.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : exp.status === "running"
                            ? "bg-amber-50 text-amber-700 border border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 animate-pulse"
                            : "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-medium">
                      {exp.results.achieved_rps > 0 ? `${exp.results.achieved_rps}/s` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-medium">
                      {exp.results.p95_latency_ms > 0 ? `${exp.results.p95_latency_ms}ms` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-medium">
                      {exp.results.total_requests}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
