import React, { useState, useMemo, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Check,
  Copy,
  Trash2,
  X,
  Play,
  ArrowUpDown,
  ArrowDown,
  Radio,
} from "lucide-react"
import type { LogEntry } from "../types/telemetry"
import { LogDetailModal } from "./LogDetailModal"

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
  const [autoScroll, setAutoScroll] = useState<boolean>(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const topAnchorRef = useRef<HTMLDivElement>(null)
  const bottomAnchorRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScroll = useRef<boolean>(false)

  // Re-enable auto-scroll when a new test/simulation starts running
  useEffect(() => {
    if (isExperimentRunning) {
      setAutoScroll(true)
    }
  }, [isExperimentRunning])

  // Auto-scroll when new logs arrive, ONLY if autoScroll is enabled
  useEffect(() => {
    if (!autoScroll) return

    const frame = requestAnimationFrame(() => {
      const el = containerRef.current
      if (!el) return

      isProgrammaticScroll.current = true
      if (sortOrder === "newest") {
        el.scrollTop = 0
      } else {
        el.scrollTop = el.scrollHeight
      }
      setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 50)
    })

    return () => cancelAnimationFrame(frame)
  }, [logs, sortOrder, autoScroll])

  // Detect manual user scrolling to pause auto-scroll without jumping back
  const handleContainerScroll = () => {
    if (!containerRef.current) return
    if (isProgrammaticScroll.current) return

    const el = containerRef.current
    if (sortOrder === "newest") {
      // In newest-first order, top is 0. If user scrolls down past 40px:
      if (el.scrollTop > 40) {
        if (autoScroll) setAutoScroll(false)
      } else {
        if (!autoScroll) setAutoScroll(true)
      }
    } else {
      // In oldest-first order, bottom is latest. Check distance from bottom:
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      if (distanceFromBottom > 40) {
        if (autoScroll) setAutoScroll(false)
      } else {
        if (!autoScroll) setAutoScroll(true)
      }
    }
  }

  const handleToggleAutoScroll = () => {
    setAutoScroll((prev) => {
      const next = !prev
      if (next && containerRef.current) {
        isProgrammaticScroll.current = true
        if (sortOrder === "newest") {
          containerRef.current.scrollTop = 0
        } else {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
        setTimeout(() => {
          isProgrammaticScroll.current = false
        }, 50)
      }
      return next
    })
  }

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
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
              Console
            </p>

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

      {/* 2. Main Console Window: Native macOS Dark Terminal */}
      <section className="overflow-hidden rounded-[28px] bg-[#0c0d10] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.35)] text-[#f5f5f7]">
        {/* Controls Toolbar: Search, Apple Sliding Segment, Sort Order */}
        <div className="flex flex-col gap-3 border-b border-white/[0.08] bg-[#121318] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Search input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by endpoint, status, trace…"
              className="h-8 w-full rounded-full bg-[#1c1d24] border border-white/[0.08] pl-8 pr-7 text-[13px] text-white placeholder-[#86868b] outline-none transition-colors focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Right: Segmented Filter Pills & Sort Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Apple Sliding Segmented Control - Dark theme */}
            <div className="flex items-center rounded-full bg-black/50 border border-white/[0.06] p-0.5 text-[12px]">
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
                        ? "text-white"
                        : "text-[#86868b] hover:text-white"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeFilterPill"
                        className="absolute inset-0 rounded-full bg-[#242630] border border-white/[0.08] shadow-sm"
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
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.05] px-3 py-1 text-[12px] font-medium text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white"
            >
              <ArrowUpDown className="h-3 w-3 text-[#86868b]" />
              <span className="capitalize">{sortOrder} first</span>
            </button>

            {/* Auto-scroll Toggle Pill */}
            <button
              type="button"
              onClick={handleToggleAutoScroll}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                autoScroll
                  ? "bg-[#0a84ff]/20 text-[#2997ff] border border-[#0a84ff]/30"
                  : "bg-white/[0.06] text-[#86868b] hover:text-white border border-white/[0.05]"
              }`}
              title={
                autoScroll
                  ? "Auto-scroll active: pinned to latest requests"
                  : "Auto-scroll paused (click to resume)"
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  autoScroll
                    ? isExperimentRunning
                      ? "bg-[#2997ff] animate-pulse"
                      : "bg-[#2997ff]"
                    : "bg-[#86868b]"
                }`}
              />
              <span>Auto-scroll</span>
            </button>
          </div>
        </div>

        {/* Console Table Header */}
        <div className="hidden border-b border-white/[0.08] bg-[#14151b] px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#86868b] sm:grid sm:grid-cols-12 sm:gap-4">
          <div className="col-span-2">Time</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Method</div>
          <div className="col-span-3">Endpoint</div>
          <div className="col-span-1 text-right">Duration</div>
          <div className="col-span-2">Trace / Span</div>
          <div className="col-span-2">Annotation</div>
        </div>

        {/* Console Table Rows (Apple macOS Dark Terminal) */}
        <div className="relative">
          <div
            ref={containerRef}
            onScroll={handleContainerScroll}
            className="max-h-[580px] min-h-[340px] overflow-y-auto overflow-x-hidden dark-terminal-scroll select-text scroll-smooth"
          >
            <div ref={topAnchorRef} />
            {displayLogs.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-8 bg-[#0c0d10]">
                <Radio className="h-8 w-8 text-[#86868b]/40 mb-2" />
                <p className="text-[15px] font-medium text-white">
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
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0a84ff] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#2997ff] transition-colors shadow-sm"
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
                      ? "text-[#ff453a]"
                      : log.status >= 400
                      ? "text-[#ff9f0a]"
                      : "text-[#30d158]"

                  const isSelected = selectedLog?.id === log.id

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(isSelected ? null : log)}
                      className={`grid cursor-pointer grid-cols-1 gap-1 border-b border-white/[0.04] px-6 py-2.5 text-[12px] font-mono transition-colors sm:grid-cols-12 sm:items-center sm:gap-4 ${
                        isSelected
                          ? "bg-[#0a84ff]/20"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      {/* Time */}
                      <div className="col-span-2 min-w-0 tabular-nums text-[#86868b]">
                        {log.timestamp}
                      </div>

                      {/* Status Code */}
                      <div className={`col-span-1 min-w-0 font-semibold tabular-nums ${statusColor}`}>
                        {log.status || 200}
                      </div>

                      {/* Method */}
                      <div className="col-span-1 min-w-0 text-[11px] font-semibold tracking-wider text-[#86868b] uppercase">
                        GET
                      </div>

                      {/* Endpoint */}
                      <div className="col-span-3 min-w-0 truncate font-medium text-white">
                        {log.endpoint || "/api/v1/test-target"}
                      </div>

                      {/* Duration */}
                      <div
                        className={`col-span-1 min-w-0 text-right tabular-nums ${
                          isSlow ? "font-semibold text-[#ff9f0a]" : "text-[#f5f5f7]"
                        }`}
                      >
                        {log.durationMs}ms
                      </div>

                      {/* Trace ID */}
                      <div className="col-span-2 min-w-0 truncate">
                        {log.traceId ? (
                          <span className="inline-block rounded bg-[#0a84ff]/15 border border-[#0a84ff]/25 px-1.5 py-0.5 text-[11px] text-[#2997ff]">
                            #{log.traceId.replace(/^tr-/, "")}
                          </span>
                        ) : (
                          <span className="text-[#86868b]/60">—</span>
                        )}
                      </div>

                      {/* Annotation Note */}
                      <div className="col-span-2 min-w-0 truncate text-[11px]">
                        {log.message ? (
                          <span className={isError ? "font-medium text-[#ff453a]" : "text-[#86868b]"}>
                            {log.message}
                          </span>
                        ) : (
                          <span className="text-white/10">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomAnchorRef} />
              </div>
            )}
          </div>

          {/* Floating Resume Stream Pill when scrolled away */}
          {!autoScroll && logs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAutoScroll(true)
                if (containerRef.current) {
                  isProgrammaticScroll.current = true
                  if (sortOrder === "newest") {
                    containerRef.current.scrollTop = 0
                  } else {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight
                  }
                  setTimeout(() => {
                    isProgrammaticScroll.current = false
                  }, 50)
                }
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#0a84ff] hover:bg-[#2997ff] px-4 py-1.5 text-[12px] font-medium text-white shadow-xl backdrop-blur-md transition-all active:scale-95"
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              <span>Resume live stream</span>
            </button>
          )}
        </div>

        {/* Full Screen Log Inspector Popover Modal */}
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onNavigateToTraces={onNavigateToTraces}
        />
      </section>
    </div>
  )
}

export default LiveLogsViewer
