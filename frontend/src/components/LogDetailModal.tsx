import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Activity,
  Code2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import type { LogEntry } from "../types/telemetry"

interface LogDetailModalProps {
  log: LogEntry | null
  onClose: () => void
  onNavigateToTraces?: (traceId?: string) => void
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({
  log,
  onClose,
  onNavigateToTraces,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && log) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [log, onClose])

  if (!log) return null

  const isError = log.status >= 400
  const isSlow = (log.durationMs || 0) >= 50

  const statusColor =
    log.status >= 500
      ? "text-[#dc2626]"
      : log.status >= 400
      ? "text-[#d97706]"
      : "text-[#28a745]"

  const statusBg =
    log.status >= 500
      ? "bg-[#ff3b30]/10 text-[#dc2626]"
      : log.status >= 400
      ? "bg-[#ff9500]/10 text-[#d97706]"
      : "bg-[#34c759]/10 text-[#28a745]"

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const curlCommand = `curl -i -X GET "http://localhost:8000${log.endpoint}" \\
  -H "Accept: application/json" \\
  -H "X-SimianX-Trace: ${log.traceId || ""}"`

  const fullJson = JSON.stringify(
    {
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      method: "GET",
      endpoint: log.endpoint,
      status: log.status,
      durationMs: log.durationMs,
      traceId: log.traceId,
      annotation: log.message || null,
      protocol: "HTTP/1.1",
      service: "scalekart-backend",
      telemetry: {
        collector: "Grafana Alloy (OTel)",
        tracing_exporter: "Grafana Tempo",
        metrics_sink: "Prometheus",
      },
    },
    null,
    2
  )

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-6 md:p-10 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 360 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex h-[92vh] max-h-[860px] w-full max-w-[940px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_35px_100px_rgba(0,0,0,0.3)]"
        >
          {/* Header Bar */}
          <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-[#fbfbfd] px-6 py-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md bg-black/[0.06] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-[#1d1d1f] uppercase">
                GET
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[12px] font-medium ${statusBg}`}
              >
                {isError ? (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  {log.status} {log.status >= 500 ? "Error" : log.status >= 400 ? "Client Error" : "OK"}
                </span>
              </span>

              <span className="text-black/20">·</span>

              <span className="text-[12.5px] font-medium text-[#6e6e73]">
                {log.timestamp}
              </span>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-2">
              {onNavigateToTraces && log.traceId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onNavigateToTraces(log.traceId)
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#0071e3]/10 px-3 py-1.5 text-[12px] font-medium text-[#0071e3] transition-colors hover:bg-[#0071e3]/20"
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>View in Traces</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-[#6e6e73] transition-colors hover:bg-black/[0.1] hover:text-[#1d1d1f]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Top Endpoint Callout */}
            <div className="rounded-2xl bg-[#f5f5f7] p-5 sm:p-6">
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Request Target
              </span>
              <h2 className="mt-1 font-mono text-[18px] sm:text-[22px] font-semibold text-[#1d1d1f] break-all">
                {log.endpoint || "/api/v1/test-target"}
              </h2>
            </div>

            {/* 4 Apple Stats KPI Grid */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-black/[0.06] sm:grid-cols-4">
              <div className="bg-white p-4 sm:p-5 text-center">
                <p className={`text-[26px] sm:text-[30px] font-semibold leading-none tabular-nums ${statusColor}`}>
                  {log.status}
                </p>
                <p className="mt-1.5 text-[12.5px] font-medium text-[#1d1d1f]">HTTP Status</p>
                <p className="mt-0.5 text-[11px] text-[#86868b]">
                  {log.status === 200 ? "Success response" : `Status code ${log.status}`}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 text-center">
                <p className="text-[26px] sm:text-[30px] font-semibold leading-none tabular-nums text-[#1d1d1f]">
                  {log.durationMs}
                  <span className="ml-1 text-[14px] font-normal text-[#86868b]">ms</span>
                </p>
                <p className="mt-1.5 text-[12.5px] font-medium text-[#1d1d1f]">Duration</p>
                <p className="mt-0.5 text-[11px] text-[#86868b]">
                  {isSlow ? "Slow execution" : "Standard latency"}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 text-center">
                <p className="text-[20px] sm:text-[22px] font-semibold leading-none font-mono text-[#0071e3] truncate px-1">
                  #{log.traceId ? log.traceId.replace(/^tr-/, "") : "none"}
                </p>
                <p className="mt-1.5 text-[12.5px] font-medium text-[#1d1d1f]">Trace Span</p>
                <p className="mt-0.5 text-[11px] text-[#86868b]">OpenTelemetry span</p>
              </div>

              <div className="bg-white p-4 sm:p-5 text-center">
                <p className="text-[26px] sm:text-[30px] font-semibold leading-none text-[#1d1d1f]">
                  {log.level || "INFO"}
                </p>
                <p className="mt-1.5 text-[12.5px] font-medium text-[#1d1d1f]">Log Level</p>
                <p className="mt-0.5 text-[11px] text-[#86868b]">Telemetry stream</p>
              </div>
            </div>

            {/* Injected Chaos / Annotation if present */}
            {log.message && (
              <div className="rounded-2xl border border-[#ff9500]/25 bg-[#ff9500]/[0.08] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-[#d97706] shrink-0" />
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#b45309]">
                      Injected Fault / Chaos Note
                    </h4>
                    <p className="mt-0.5 text-[13px] text-[#78350f]">
                      {log.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* cURL Replay Snippet */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#fbfbfd] p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#86868b]" />
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#86868b]">
                    Replay cURL Command
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlCommand, "curl")}
                  className="inline-flex h-7 w-[104px] shrink-0 items-center justify-center gap-1 rounded-full bg-black/[0.04] text-[11.5px] font-medium text-[#1d1d1f] hover:bg-black/[0.08] transition-colors"
                >
                  {copiedKey === "curl" ? (
                    <>
                      <Check className="h-3 w-3 text-[#34c759]" />
                      <span>Copied cURL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-[#6e6e73]" />
                      <span>Copy cURL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-black/[0.03] p-3 font-mono text-[12px] text-[#1d1d1f] leading-relaxed">
                {curlCommand}
              </pre>
            </div>

            {/* Full JSON Payload */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#fbfbfd] p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#86868b]" />
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#86868b]">
                    Full Telemetry Record (JSON)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(fullJson, "json")}
                  className="inline-flex h-7 w-[104px] shrink-0 items-center justify-center gap-1 rounded-full bg-black/[0.04] text-[11.5px] font-medium text-[#1d1d1f] hover:bg-black/[0.08] transition-colors"
                >
                  {copiedKey === "json" ? (
                    <>
                      <Check className="h-3 w-3 text-[#34c759]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-[#6e6e73]" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="max-h-[260px] overflow-y-auto rounded-xl bg-black/[0.03] p-3 font-mono text-[12px] text-[#1d1d1f] leading-relaxed">
                {fullJson}
              </pre>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex shrink-0 items-center justify-between border-t border-black/[0.06] bg-[#fbfbfd] px-6 py-4 sm:px-8">
            <span className="text-[12px] text-[#86868b]">
              Press <kbd className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[11px]">ESC</kbd> or click outside to dismiss
            </span>

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

export default LogDetailModal
