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
    <div className="relative overflow-hidden rounded-2xl bg-zinc-950/70 p-5 sm:p-6 border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all">
      {/* Specular Top Edge Light Refraction */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white font-sans">
            Experiment Audit Archive
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Historical trace of reliability experiments executed on this Kubernetes cluster.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1 text-xs font-medium text-zinc-300 border border-white/[0.08] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        {experiments.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-400 font-mono">
            No experiments recorded in current session. Launch a chaos experiment above.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-zinc-400 font-sans">
                <th className="pb-2.5 font-medium">Experiment ID</th>
                <th className="pb-2.5 font-medium">Scenario</th>
                <th className="pb-2.5 font-medium">Intensity</th>
                <th className="pb-2.5 font-medium">Duration</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium text-right">Achieved RPS</th>
                <th className="pb-2.5 font-medium text-right">P95 Latency</th>
                <th className="pb-2.5 font-medium text-right">Total Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {experiments.map((exp) => {
                const isSelected = exp.id === selectedExperimentId
                const isSuccess = exp.status === "completed"
                const isStopped = exp.status === "stopped"

                return (
                  <tr
                    key={exp.id}
                    onClick={() => onSelectExperiment(exp)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-500/10"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-3 font-semibold text-white">
                      {exp.id.slice(0, 8)}
                    </td>
                    <td className="py-3 text-zinc-300">
                      {exp.scenario}
                    </td>
                    <td className="py-3 capitalize text-zinc-400">
                      {exp.intensity}
                    </td>
                    <td className="py-3 text-zinc-400">
                      {exp.duration_seconds}s
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          isSuccess
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isStopped
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-white tabular-nums">
                      {exp.results.achieved_rps}
                    </td>
                    <td className="py-3 text-right tabular-nums text-zinc-300">
                      {exp.results.p95_latency_ms}ms
                    </td>
                    <td className="py-3 text-right tabular-nums text-zinc-400">
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

export default ExperimentHistoryTable
