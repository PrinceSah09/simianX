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
          <div>
            <h3 className="text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f] sm:text-[40px]">
              Archive
            </h3>
            <p className="mt-1 text-[14px] text-[#6e6e73]">
              Past experiment runs, chaos scenarios, and benchmark vitals.
            </p>
          </div>
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
        <div className="py-16 text-center">
          <p className="text-[17px] font-medium text-[#1d1d1f]">No experiments archived yet</p>
          <p className="mt-1 text-[14px] text-[#6e6e73]">
            Run a simulation from the Studio tab to record telemetry and failure analysis.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-left text-[13px]">
            <thead>
              <tr className="text-[12px] text-[#86868b]">
                <th className="pb-1.5 pl-4 font-medium">Run</th>
                <th className="pb-1.5 px-3 font-medium">Scenario</th>
                <th className="pb-1.5 px-3 font-medium">Intensity</th>
                <th className="pb-1.5 px-3 font-medium">Status</th>
                <th className="pb-1.5 px-3 text-right font-medium">RPS</th>
                <th className="pb-1.5 px-3 text-right font-medium">P95</th>
                <th className="pb-1.5 pr-4 text-right font-medium">Requests</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((exp) => {
                const isSelected = exp.id === selectedExperimentId
                return (
                  <tr
                    key={exp.id}
                    onClick={() => onSelectExperiment(exp)}
                    className={`group cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-[#0071e3]/[0.08] shadow-sm"
                        : "bg-[#f9f9fb] hover:bg-[#f2f2f7]"
                    }`}
                  >
                    <td className="py-3.5 pl-4 pr-3 font-mono text-[12px] font-medium text-[#1d1d1f] rounded-l-[14px]">
                      <span className="transition-colors group-hover:text-[#0071e3]">
                        {exp.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-medium capitalize text-[#1d1d1f]">
                      {exp.scenario.replaceAll("_", " ")}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-medium capitalize text-[#6e6e73]">
                        {exp.intensity}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                          exp.status === "completed"
                            ? "bg-[#34c759]/10 text-[#28a745]"
                            : exp.status === "running"
                            ? "bg-[#0071e3]/10 text-[#0071e3]"
                            : exp.status === "failed"
                            ? "bg-[#ff3b30]/10 text-[#dc2626]"
                            : "bg-black/[0.05] text-[#6e6e73]"
                        }`}
                      >
                        {exp.status === "running" && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0071e3]" />
                        )}
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium tabular-nums text-[#1d1d1f]">
                      {exp.results.achieved_rps}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-[#6e6e73]">
                      {exp.results.p95_latency_ms} ms
                    </td>
                    <td className="py-3.5 pl-3 pr-4 text-right tabular-nums text-[#6e6e73] rounded-r-[14px]">
                      {exp.results.total_requests}
                    </td>
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
