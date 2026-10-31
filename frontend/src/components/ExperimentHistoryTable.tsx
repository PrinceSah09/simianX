import React from "react"
import type { Experiment } from "../types/experiment"

interface ExperimentHistoryTableProps {
  experiments: Experiment[]
  selectedExperimentId: string | null
  onSelectExperiment: (experiment: Experiment) => void
  onRefresh: () => void
  isLoading: boolean
  embedded?: boolean
}

export const ExperimentHistoryTable: React.FC<ExperimentHistoryTableProps> = ({
  experiments,
  selectedExperimentId,
  onSelectExperiment,
  onRefresh,
  isLoading,
  embedded = false,
}) => {
  return (
    <div className={embedded ? "pt-6" : "rounded-[28px] bg-white px-6 py-8 sm:px-10 sm:py-10"}>
      {!embedded && (
      <div className="flex items-end justify-between gap-4 pb-6">
        <h3 className="text-[32px] font-semibold tracking-[-0.035em] sm:text-[40px]">History</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-[15px] text-[#0066cc] hover:underline disabled:opacity-50"
        >
          {isLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      )}

      {experiments.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-[#6e6e73]">No experiments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/[0.08] text-[12px] text-[#86868b]">
                <th className="pb-3 font-medium">Run</th>
                <th className="pb-3 font-medium">Scenario</th>
                <th className="pb-3 font-medium">Intensity</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 text-right font-medium">RPS</th>
                <th className="pb-3 text-right font-medium">P95</th>
                <th className="pb-3 text-right font-medium">Requests</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((exp) => {
                const isSelected = exp.id === selectedExperimentId
                return (
                  <tr
                    key={exp.id}
                    onClick={() => onSelectExperiment(exp)}
                    className={`cursor-pointer border-b border-black/[0.05] transition-colors ${
                      isSelected ? "bg-[#f5f5f7]" : "hover:bg-[#f5f5f7]"
                    }`}
                  >
                    <td className="py-4 font-medium">{exp.id.slice(0, 8)}</td>
                    <td className="py-4 capitalize text-[#1d1d1f]">{exp.scenario.replaceAll("_", " ")}</td>
                    <td className="py-4 capitalize text-[#6e6e73]">{exp.intensity}</td>
                    <td className="py-4 capitalize text-[#6e6e73]">{exp.status}</td>
                    <td className="py-4 text-right tabular-nums">{exp.results.achieved_rps}</td>
                    <td className="py-4 text-right tabular-nums">{exp.results.p95_latency_ms} ms</td>
                    <td className="py-4 text-right tabular-nums text-[#6e6e73]">{exp.results.total_requests}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ExperimentHistoryTable
