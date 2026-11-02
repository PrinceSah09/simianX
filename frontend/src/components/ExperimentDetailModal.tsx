import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Check, Clock, AlertTriangle } from "lucide-react"
import type { Experiment } from "../types/experiment"

interface ExperimentDetailModalProps {
  experiment: Experiment | null
  onClose: () => void
}

export const ExperimentDetailModal: React.FC<ExperimentDetailModalProps> = ({
  experiment,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && experiment) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [experiment, onClose])

  if (!experiment) return null

  const { results } = experiment

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const cells = [
    [
      "Achieved rate",
      results ? String(results.achieved_rps) : "—",
      "req/s",
      results ? `${results.total_requests.toLocaleString()} requests` : "Pending",
    ],
    [
      "P95 latency",
      results ? String(results.p95_latency_ms) : "—",
      "ms",
      results ? `P50 ${results.p50_latency_ms}ms · P99 ${results.p99_latency_ms}ms` : "Pending",
    ],
    [
      "Error rate",
      results ? `${results.error_rate}%` : "0%",
      "",
      results ? `${results.failed_requests.toLocaleString()} failed` : "0 failed",
    ],
    [
      "Runtime",
      results ? String(results.duration_seconds) : String(experiment.duration_seconds),
      "s",
      `Target ${experiment.duration_seconds}s`,
    ],
  ]

  const formattedDate = experiment.created_at
    ? new Date(experiment.created_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Just now"

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: "spring", damping: 30, stiffness: 380 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[90vh] w-full max-w-[680px] overflow-y-auto rounded-[28px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.22)] no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-black/[0.06] p-6 sm:p-8">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                  Experiment Detail
                </span>
                <span className="text-black/20">·</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium capitalize ${
                    experiment.status === "completed"
                      ? "bg-[#34c759]/10 text-[#28a745]"
                      : experiment.status === "running"
                      ? "bg-[#0071e3]/10 text-[#0071e3]"
                      : experiment.status === "failed"
                      ? "bg-[#ff3b30]/10 text-[#dc2626]"
                      : "bg-black/[0.05] text-[#6e6e73]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      experiment.status === "completed"
                        ? "bg-[#34c759]"
                        : experiment.status === "running"
                        ? "bg-[#0071e3] animate-pulse"
                        : experiment.status === "failed"
                        ? "bg-[#ff3b30]"
                        : "bg-[#86868b]"
                    }`}
                  />
                  {experiment.status}
                </span>

                <span className="inline-flex items-center rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11.5px] font-medium capitalize text-[#6e6e73]">
                  {experiment.intensity} intensity
                </span>
              </div>

              <h3 className="text-[28px] font-semibold tracking-[-0.035em] text-[#1d1d1f] capitalize sm:text-[34px]">
                {experiment.scenario.replaceAll("_", " ")}
              </h3>

              <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#6e6e73]">
                <span className="font-mono text-[12px] font-medium text-[#1d1d1f]">
                  Run: {experiment.id.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(experiment.id, "runId")}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#0071e3] hover:bg-[#0071e3]/10 transition-colors"
                  title="Copy full Run UUID"
                >
                  {copiedKey === "runId" ? (
                    <>
                      <Check className="h-3 w-3 text-[#34c759]" />
                      <span>Copied ID</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
                <span className="text-black/20">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#86868b]" />
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-[#6e6e73] transition-colors hover:bg-black/[0.08] hover:text-[#1d1d1f]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 4 Stats Grid (Matches top of History / Results Card) */}
          <div className="grid grid-cols-2 gap-px bg-black/[0.06] sm:grid-cols-4">
            {cells.map(([label, value, unit, note]) => (
              <div key={label} className="bg-white p-4 sm:p-6 text-center flex flex-col justify-center items-center min-w-0">
                <div className="inline-flex items-baseline justify-center whitespace-nowrap shrink-0 leading-none">
                  <span className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.035em] tabular-nums text-[#1d1d1f] whitespace-nowrap">
                    {value}
                  </span>
                  {unit && (
                    <span className="ml-1 inline-block whitespace-nowrap text-[12px] sm:text-[14px] font-normal tracking-normal text-[#6e6e73] shrink-0">
                      {unit}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[13px] font-medium text-[#1d1d1f] whitespace-nowrap">{label}</p>
                <p className="mt-0.5 text-[11.5px] text-[#86868b] truncate max-w-full px-1">{note}</p>
              </div>
            ))}
          </div>

          {/* Additional Details & Latency Breakdown */}
          <div className="space-y-4 p-6 sm:p-8">
            {experiment.error_message && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-[#ff3b30]/10 p-4 text-[13px] text-[#dc2626]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{experiment.error_message}</p>
              </div>
            )}

            {/* Target and Distribution Specs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f9f9fb] p-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#86868b]">
                  Target Endpoint
                </p>
                <p className="mt-1 font-mono text-[13px] text-[#1d1d1f] truncate">
                  {experiment.target_endpoint || "http://simianx-backend:8000/api/v1/workload"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f9f9fb] p-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#86868b]">
                  Latency Distribution
                </p>
                <div className="mt-1 flex items-center justify-between text-[12.5px] font-mono">
                  <span>P50: {results?.p50_latency_ms ?? 0}ms</span>
                  <span className="text-black/20">|</span>
                  <span>P90: {results?.p90_latency_ms ?? 0}ms</span>
                  <span className="text-black/20">|</span>
                  <span>P99: {results?.p99_latency_ms ?? 0}ms</span>
                </div>
              </div>
            </div>

            {/* Status Codes Breakdown */}
            {results?.status_codes && Object.keys(results.status_codes).length > 0 && (
              <div className="rounded-2xl bg-[#f9f9fb] p-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#86868b] mb-2">
                  HTTP Status Responses
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(results.status_codes).map(([code, count]) => {
                    const statusCode = Number(code)
                    const isErr = statusCode >= 400
                    return (
                      <span
                        key={code}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[12px] font-medium ${
                          isErr
                            ? "bg-[#ff3b30]/10 text-[#dc2626]"
                            : "bg-[#34c759]/10 text-[#28a745]"
                        }`}
                      >
                        <span>{code}</span>
                        <span className="text-black/30">·</span>
                        <span>{count.toLocaleString()}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-black/[0.06] bg-[#fbfbfd] px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => copyToClipboard(JSON.stringify(experiment, null, 2), "json")}
              className="inline-flex h-9 w-[132px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-black/[0.04] text-[13px] font-medium text-[#1d1d1f] transition-colors hover:bg-black/[0.08] active:scale-[0.98]"
            >
              {copiedKey === "json" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#34c759] shrink-0" />
                  <span className="w-[72px] text-left">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#6e6e73] shrink-0" />
                  <span className="w-[72px] text-left">Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#1d1d1f] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ExperimentDetailModal
