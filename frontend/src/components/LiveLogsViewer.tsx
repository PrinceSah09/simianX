import React, { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Check,
  Copy,
  Trash2,
  ExternalLink,
  X,
  Play,
  ArrowUpDown,
  Radio,
} from "lucide-react"
import type { LogEntry } from "../types/telemetry"

interface LiveLogsViewerProps {
  logs: LogEntry[]
  onClearLogs: () => void
  onProbeTarget?: () => Promise<any>
  onNavigateToTraces?: (traceId?: string) => void
  isExperimentRunning?: boolean
}

type FilterPreset = "all" | "success" | "errors" | "slow"
type SortOrder = "newest" | "oldest"

export const LiveLogsViewer: React.FC<LiveLogsViewerProps> = ({
  logs,
  onClearLogs,
  onProbeTarget,
  onNavigateToTraces,
  isExperimentRunning = false,
}) => {
  const [filterQuery, setFilterQuery] = useState<string>("")
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isProbing, setIsProbing] = useState<boolean>(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Filtered and ordered logs
  const displayLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      // 1. Preset filter
      if (filterPreset === "success" && (log.status < 200 || log.status >= 300)) return false
      if (filterPreset === "errors" && log.status < 400) return false
      if (filterPreset === "slow" && (log.durationMs || 0) < 50) return false

      // 2. Search query filter
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase()
        const matchEndpoint = (log.endpoint || "").toLowerCase().includes(q)
        const matchTrace = (log.traceId || "").toLowerCase().includes(q)
        const matchStatus = String(log.status || "").includes(q)
        const matchMsg = (log.message || "").toLowerCase().includes(q)
        if (!matchEndpoint && !matchTrace && !matchStatus && !matchMsg) return false
      }

      return true
    })

    // Return in selected order (default newest first)
    return sortOrder === "newest" ? [...filtered].reverse() : filtered
  }, [logs, filterPreset, filterQuery, sortOrder])

  // Summary counts
  const stats = useMemo(() => {
    const total = logs.length
    const errors = logs.filter((l) => l.status >= 400).length
    const slow = logs.filter((l) => (l.durationMs || 0) >= 50).length
    const ok = total - errors
    const successRate = total > 0 ? ((ok / total) * 100).toFixed(1) : "100"
    const avgDuration =
      total > 0
        ? (logs.reduce((acc, l) => acc + (l.durationMs || 0), 0) / total).toFixed(1)
        : "0"
    return { total, ok, errors, slow, successRate, avgDuration }
  }, [logs])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(displayLogs, null, 2)
    copyToClipboard(jsonStr, "json")
  }

  const handleProbe = async () => {
    if (!onProbeTarget || isProbing) return
    setIsProbing(true)
    try {
      await onProbeTarget()
    } finally {
      setIsProbing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Header & KPI Cards: Authentic Apple HIG */}
      <section className="overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
                Console
              </span>
              <span className="text-[12px] text-black/20">·</span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0071e3]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isExperimentRunning
                      ? "animate-pulse bg-[#0071e3]"
                      : "bg-[#34c759]"
                  }`}
                />
                {isExperimentRunning ? "Simulation live" : "Stream active"}
              </span>
            </div>

            <h2 className="mt-1 text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f] sm:text-[38px]">
              Activity
            </h2>
            <p className="mt-1 text-[16px] text-[#6e6e73]">
              Every HTTP request through the fleet, with status, tail latency, and trace correlation.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            

            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 py-2 text-[13px] font-medium text-[#1d1d1f] transition-all hover:bg-black/[0.08] active:scale-[0.98]"
            >
              {copiedKey === "json" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#34c759]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#6e6e73]" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            {onProbeTarget && (
              <button
                type="button"
                onClick={handleProbe}
                disabled={isProbing}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-4 py-2 text-[13px] font-medium text-[#1d1d1f] transition-all hover:bg-black/[0.08] active:scale-[0.98] disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-[#1d1d1f]" />
                <span>{isProbing ? "Sending…" : "Probe Target"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClearLogs}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 py-2 text-[13px] font-medium text-[#6e6e73] transition-all hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] active:scale-[0.98]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Apple Stats (Activity Rings / Health Aesthetic) */}
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-black/[0.06] sm:grid-cols-4">
          <div className="bg-white p-4 text-center">
            <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#1d1d1f]">
              {stats.total}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6e6e73]">Calls recorded</p>
          </div>

          <div className="bg-white p-4 text-center">
            <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#30d158]">
              {stats.successRate}%
            </p>
            <p className="mt-1.5 text-[12px] text-[#6e6e73]">Success rate</p>
          </div>

          <div className="bg-white p-4 text-center">
            <p
              className={`text-[28px] font-semibold leading-none tracking-tight tabular-nums ${
                stats.errors > 0 ? "text-[#ff3b30]" : "text-[#1d1d1f]"
              }`}
            >
              {stats.errors}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6e6e73]">Faults &amp; errors</p>
          </div>

          <div className="bg-white p-4 text-center">
            <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#1d1d1f]">
              {stats.avgDuration} <span className="text-[16px] font-normal text-[#86868b]">ms</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6e6e73]">Average latency</p>
          </div>
        </div>
      </section>

      {/* 2. Main Console Window: Native macOS Light Table */}
      <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Controls Toolbar: Search, Apple Sliding Segment, Sort Order */}
        <div className="flex flex-col gap-3 border-b border-black/[0.06] bg-[#fbfbfd] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Search input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by endpoint, status, trace…"
              className="h-8 w-full rounded-full bg-[#f0f0f2] pl-8 pr-7 text-[13px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition-colors focus:bg-white focus:ring-1 focus:ring-black/[0.12]"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Right: Segmented Filter Pills & Sort Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Apple Sliding Segmented Control */}
            <div className="flex items-center rounded-full bg-black/[0.05] p-0.5 text-[12px]">
              {(
                [
                  ["all", "All"],
                  ["success", "200s OK"],
                  ["errors", "Errors"],
                  ["slow", "Slow (>50ms)"],
                ] as const
              ).map(([key, label]) => {
                const isSelected = filterPreset === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterPreset(key)}
                    className={`relative rounded-full px-3 py-1 font-medium transition-colors ${
                      isSelected
                        ? "text-[#1d1d1f]"
                        : "text-[#6e6e73] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeFilterPill"
                        className="absolute inset-0 rounded-full bg-white shadow-sm"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                )
              })}
            </div>

            {/* Sort Order Toggle Pill */}
            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
              }
              title={`Switch order (currently ${sortOrder === "newest" ? "Newest on top" : "Oldest on top"})`}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1 text-[12px] font-medium text-[#1d1d1f]/80 transition-colors hover:bg-black/[0.08]"
            >
              <ArrowUpDown className="h-3 w-3 text-[#6e6e73]" />
              <span className="capitalize">{sortOrder} first</span>
            </button>
          </div>
        </div>

        {/* Console Table Header */}
        <div className="hidden border-b border-black/[0.06] bg-[#fbfbfd] px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#86868b] sm:grid sm:grid-cols-12 sm:gap-4">
          <div className="col-span-2">Time</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Method</div>
          <div className="col-span-3">Endpoint</div>
          <div className="col-span-1 text-right">Duration</div>
          <div className="col-span-2">Trace / Span</div>
          <div className="col-span-2">Annotation</div>
        </div>

        {/* Console Table Rows (No Window Scrolling, Clean Monospace Cells) */}
        <div
          ref={containerRef}
          className="max-h-[580px] min-h-[340px] overflow-y-auto select-text"
        >
          {displayLogs.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-8">
              <Radio className="h-8 w-8 text-[#86868b]/40 mb-2" />
              <p className="text-[15px] font-medium text-[#1d1d1f]">
                {logs.length === 0 ? "No requests recorded yet" : "No requests match your filter"}
              </p>
              <p className="mt-1 text-[13px] text-[#86868b] max-w-sm">
                {logs.length === 0
                  ? "Launch a chaos scenario from Studio or click 'Probe Target' to generate live HTTP requests."
                  : "Try clearing search filters or switching presets."}
              </p>
              {logs.length === 0 && onProbeTarget && (
                <button
                  type="button"
                  onClick={handleProbe}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#0077ed] transition-colors shadow-sm"
                >
                  <Play className="h-3 w-3 fill-white" />
                  <span>Send probe request</span>
                </button>
              )}
            </div>
          ) : (
            <div>
              {displayLogs.map((log) => {
                const isError = log.status >= 400
                const isSlow = (log.durationMs || 0) >= 50
                const statusColor =
                  log.status >= 500
                    ? "text-[#dc2626]"
                    : log.status >= 400
                    ? "text-[#d97706]"
                    : "text-[#28a745]"

                const isSelected = selectedLog?.id === log.id

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(isSelected ? null : log)}
                    className={`grid cursor-pointer grid-cols-1 gap-1 border-b border-black/[0.04] px-6 py-2.5 text-[12px] font-mono transition-colors sm:grid-cols-12 sm:items-center sm:gap-4 ${
                      isSelected
                        ? "bg-[#0071e3]/[0.08]"
                        : "hover:bg-[#fbfbfd]"
                    }`}
                  >
                    {/* Time */}
                    <div className="col-span-2 tabular-nums text-[#86868b]">
                      {log.timestamp}
                    </div>

                    {/* Status Code */}
                    <div className={`col-span-1 font-semibold tabular-nums ${statusColor}`}>
                      {log.status || 200}
                    </div>

                    {/* Method */}
                    <div className="col-span-1 text-[11px] font-semibold tracking-wider text-[#86868b] uppercase">
                      GET
                    </div>

                    {/* Endpoint */}
                    <div className="col-span-3 truncate font-medium text-[#1d1d1f]">
                      {log.endpoint || "/api/v1/test-target"}
                    </div>

                    {/* Duration */}
                    <div
                      className={`col-span-1 text-right tabular-nums ${
                        isSlow ? "font-semibold text-[#d97706]" : "text-[#1d1d1f]"
                      }`}
                    >
                      {log.durationMs}ms
                    </div>

                    {/* Trace ID */}
                    <div className="col-span-2 truncate">
                      {log.traceId ? (
                        <span className="inline-block rounded bg-[#0071e3]/[0.07] px-1.5 py-0.5 text-[11px] text-[#0071e3]">
                          #{log.traceId.replace(/^tr-/, "")}
                        </span>
                      ) : (
                        <span className="text-[#86868b]">—</span>
                      )}
                    </div>

                    {/* Annotation Note */}
                    <div className="col-span-2 truncate text-[11px]">
                      {log.message ? (
                        <span className={isError ? "font-medium text-[#dc2626]" : "text-[#6e6e73]"}>
                          {log.message}
                        </span>
                      ) : (
                        <span className="text-black/15">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Inspector Detail Bar (Apple Cupertino Slide-Up Panel) */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-black/[0.08] bg-[#fbfbfd] px-6 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-[13px]">
                  <span className="font-semibold text-[#1d1d1f]">Call Inspector</span>
                  <span className="text-black/20">·</span>
                  <span className="font-mono text-[12px] text-[#6e6e73]">
                    Status: <strong className="text-[#1d1d1f]">{selectedLog.status}</strong>
                  </span>
                  <span className="text-black/20">·</span>
                  <span className="font-mono text-[12px] text-[#6e6e73]">
                    Latency: <strong className="text-[#1d1d1f]">{selectedLog.durationMs}ms</strong>
                  </span>
                  <span className="text-black/20">·</span>
                  <span className="font-mono text-[12px] text-[#6e6e73]">
                    Span: <strong className="text-[#0071e3]">#{selectedLog.traceId?.replace(/^tr-/, "")}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateToTraces && selectedLog.traceId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTraces(selectedLog.traceId)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3]/10 px-3 py-1 text-[12px] font-medium text-[#0071e3] transition-colors hover:bg-[#0071e3]/20"
                    >
                      <span>View in Traces</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `curl -i http://localhost:8000${selectedLog.endpoint}`,
                        "curl"
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1 text-[12px] font-medium text-[#1d1d1f] transition-colors hover:bg-black/[0.08]"
                  >
                    <Copy className="h-3 w-3 text-[#6e6e73]" />
                    <span>{copiedKey === "curl" ? "Copied cURL" : "Copy cURL"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[#86868b] transition-colors hover:bg-black/[0.06] hover:text-[#1d1d1f]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Extra Message / Fault detail if present */}
              {selectedLog.message && (
                <div className="mt-2.5 rounded-xl bg-black/[0.03] p-2.5 text-[12px] text-[#6e6e73]">
                  <span className="font-semibold text-[#1d1d1f]">Injected Chaos Note:</span>{" "}
                  {selectedLog.message}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}

export default LiveLogsViewer
