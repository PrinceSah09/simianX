import React, { useEffect, useRef, useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Copy,
  RefreshCw,
  Search,
  Check,
  Layers,
  X,
  ListTree,
  BarChart2,
} from "lucide-react"
import { fetchTraceDetail, fetchTraces } from "../services/api"
import type { SpanDetail, TraceDetail, TraceSummaryItem } from "../types/experiment"

interface TraceWaterfallViewerProps {
  onSelectTrace?: (traceId: string) => void
}

type TraceFilter = "all" | "chaos" | "slow" | "errors"
type ViewMode = "timeline" | "operations"

function formatTraceTime(isoStr: string) {
  try {
    const d = new Date(isoStr)
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diffSec < 5) return "just now"
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    return d.toTimeString().split(" ")[0]
  } catch {
    return isoStr
  }
}

export const TraceWaterfallViewer: React.FC<TraceWaterfallViewerProps> = () => {
  const [traces, setTraces] = useState<TraceSummaryItem[]>([])
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [selectedTraceDetail, setSelectedTraceDetail] = useState<TraceDetail | null>(null)
  const [selectedSpan, setSelectedSpan] = useState<SpanDetail | null>(null)
  const [isLoadingTraces, setIsLoadingTraces] = useState<boolean>(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false)
  const [filterQuery, setFilterQuery] = useState<string>("")
  const [activeFilter, setActiveFilter] = useState<TraceFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("timeline")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [inspectorTab, setInspectorTab] = useState<"overview" | "attributes">("overview")

  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedTraceId

  const loadTraces = async () => {
    setIsLoadingTraces(true)
    try {
      const data = await fetchTraces(50)
      setTraces(data)
      if (data.length > 0 && !selectedIdRef.current) {
        setSelectedTraceId(data[0].trace_id)
      }
    } catch (e) {
      console.error("Failed to load traces:", e)
    } finally {
      setIsLoadingTraces(false)
    }
  }

  useEffect(() => {
    loadTraces()
    const interval = setInterval(loadTraces, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selectedTraceId) return
    setIsLoadingDetail(true)
    fetchTraceDetail(selectedTraceId)
      .then((detail) => {
        setSelectedTraceDetail(detail)
        if (detail.spans.length > 0) {
          setSelectedSpan(detail.spans[0])
        }
      })
      .catch((e) => console.error("Failed to load trace detail:", e))
      .finally(() => setIsLoadingDetail(false))
  }, [selectedTraceId])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter master traces list
  const filteredTraces = useMemo(() => {
    return traces.filter((t) => {
      // Search query
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase()
        const matchId = t.trace_id.toLowerCase().includes(q)
        const matchName = t.root_name.toLowerCase().includes(q)
        const matchScenario = t.scenario.toLowerCase().includes(q)
        if (!matchId && !matchName && !matchScenario) return false
      }

      // Filter preset
      const isError = t.status === "ERROR" || t.status_code >= 400
      const isSlow = t.duration_ms >= 50
      const isChaos = t.scenario !== "standard" || t.root_name.toLowerCase().includes("chaos")

      if (activeFilter === "errors") return isError
      if (activeFilter === "slow") return isSlow
      if (activeFilter === "chaos") return isChaos
      return true
    })
  }, [traces, filterQuery, activeFilter])

  // Aggregate stats across captured traces
  const traceStats = useMemo(() => {
    const count = traces.length
    const errors = traces.filter((t) => t.status === "ERROR" || t.status_code >= 400).length
    const totalDuration = traces.reduce((acc, t) => acc + t.duration_ms, 0)
    const avgDuration = count > 0 ? (totalDuration / count).toFixed(1) : "0"
    const totalSpans = traces.reduce((acc, t) => acc + t.span_count, 0)
    return { count, errors, avgDuration, totalSpans }
  }, [traces])

  // Filtered and processed spans for current trace
  const processedSpans = useMemo(() => {
    if (!selectedTraceDetail) return []
    let spans = selectedTraceDetail.spans

    // Exclude transport microspans like http send / http receive if present
    spans = spans.filter(
      (s) =>
        !s.name.endsWith("http send") &&
        !s.name.endsWith("http receive") &&
        s.name !== "http send" &&
        s.name !== "http receive"
    )

    return spans
  }, [selectedTraceDetail])

  // Operations Breakdown (Group identical calls into high-level summary cards)
  const operationsBreakdown = useMemo(() => {
    if (!processedSpans.length) return []
    const groups: Record<
      string,
      {
        name: string
        count: number
        totalDuration: number
        minDuration: number
        maxDuration: number
        errorCount: number
        spans: SpanDetail[]
      }
    > = {}

    for (const span of processedSpans) {
      const groupKey = span.name
      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: span.name,
          count: 0,
          totalDuration: 0,
          minDuration: span.duration_ms,
          maxDuration: span.duration_ms,
          errorCount: 0,
          spans: [],
        }
      }
      const g = groups[groupKey]
      g.count += 1
      g.totalDuration += span.duration_ms
      g.minDuration = Math.min(g.minDuration, span.duration_ms)
      g.maxDuration = Math.max(g.maxDuration, span.duration_ms)
      if (span.status.includes("ERROR")) g.errorCount += 1
      g.spans.push(span)
    }

    return Object.values(groups).sort((a, b) => b.totalDuration - a.totalDuration)
  }, [processedSpans])

  // Timeline scale calculation
  const totalDurationMs = selectedTraceDetail
    ? Math.max(selectedTraceDetail.duration_ms, 1)
    : 100

  const earliestStartNs = selectedTraceDetail?.spans.length
    ? Math.min(...selectedTraceDetail.spans.map((s) => new Date(s.start_time).getTime()))
    : 0

  return (
    <div className="space-y-4">
      {/* 1. Header Card: Apple Studio Clean Typography & Summary Strip */}
      <section className="overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
              Observability
            </p>

            <h2 className="mt-1 text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f] sm:text-[38px]">
              Distributed Traces
            </h2>
            <p className="mt-1 text-[16px] text-[#6e6e73]">
              End-to-end request propagation, tail latency breakdowns, and span call graphs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadTraces}
              disabled={isLoadingTraces}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-4 py-2 text-[13px] font-medium text-[#1d1d1f] transition-all hover:bg-black/[0.08] active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#6e6e73] ${isLoadingTraces ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Apple Stats */}
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-black/[0.06] sm:grid-cols-4">
          <div className="bg-white p-4 text-center">
            <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#1d1d1f]">
              {traceStats.count}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6e6e73]">Traces captured</p>
          </div>

          <div className="bg-white p-4 text-center">
            <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#1d1d1f]">
              {traceStats.totalSpans}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6e6e73]">Total spans</p>
          </div>

          <div className="bg-white p-4 text-center">
            <p
              className={`text-[28px] font-semibold leading-none tracking-tight tabular-nums ${
                traceStats.errors > 0 ? "text-[#ff3b30]" : "text-[#1d1d1f]"
              }`}
            >
              {traceStats.errors}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6e6e73]">Traces with errors</p>
          </div>

          <div className="bg-white p-4 text-center">
            <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#1d1d1f]">
              {traceStats.avgDuration} <span className="text-[16px] font-normal text-[#86868b]">ms</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6e6e73]">Average trace duration</p>
          </div>
        </div>
      </section>

      {/* 2. Main Workstation: Apple macOS Instruments / Safari Web Inspector Split Pane */}
      <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Workstation Top Toolbar */}
        <div className="flex flex-col gap-3 border-b border-black/[0.06] bg-[#fbfbfd] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Master search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search traces by ID or scenario…"
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

          {/* Right: Segmented Filter Pills */}
          <div className="flex items-center rounded-full bg-black/[0.05] p-0.5 text-[12px]">
            {(
              [
                ["all", "All"],
                ["chaos", "Chaos"],
                ["slow", "Slow (>50ms)"],
                ["errors", "Errors"],
              ] as const
            ).map(([key, label]) => {
              const isSelected = activeFilter === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`relative rounded-full px-3 py-1 font-medium transition-colors ${
                    isSelected
                      ? "text-[#1d1d1f]"
                      : "text-[#6e6e73] hover:text-[#1d1d1f]"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeTraceTabPill"
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2-Pane Workstation: Left Sidebar + Right Canvas */}
        <div className="flex flex-col lg:flex-row h-[720px] overflow-hidden">
          {/* LEFT PANE: Trace Navigator Sidebar */}
          <div className="flex w-full lg:w-[320px] shrink-0 flex-col border-b lg:border-b-0 lg:border-r border-black/[0.06] bg-[#fafafc]">
            <div className="flex items-center justify-between border-b border-black/[0.04] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
              <span>Captured Traces ({filteredTraces.length})</span>
              <span>Latest first</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-black/[0.03] select-none">
              {filteredTraces.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center px-4 text-center text-[#86868b]">
                  <Layers className="mb-2 h-7 w-7 opacity-30 text-[#86868b]" />
                  <p className="text-[13px] font-medium text-[#1d1d1f]">No traces match</p>
                  <p className="mt-1 text-[11px] text-[#86868b]">
                    Run a scenario from Studio to record distributed traces.
                  </p>
                </div>
              ) : (
                filteredTraces.map((trace) => {
                  const isSelected = trace.trace_id === selectedTraceId
                  const isError = trace.status === "ERROR" || trace.status_code >= 400
                  const isSlow = trace.duration_ms >= 100

                  return (
                    <button
                      key={trace.trace_id}
                      type="button"
                      onClick={() => setSelectedTraceId(trace.trace_id)}
                      className={`w-full p-3.5 text-left transition-colors ${
                        isSelected
                          ? "bg-[#0071e3]/[0.08]"
                          : "hover:bg-black/[0.025]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-[13px] font-semibold tracking-tight ${
                            isSelected ? "text-[#0071e3]" : "text-[#1d1d1f]"
                          }`}
                        >
                          {trace.root_name}
                        </span>
                        <span
                          className={`shrink-0 font-mono text-[12px] tabular-nums ${
                            isSlow ? "text-[#d97706] font-semibold" : "text-[#1d1d1f]"
                          }`}
                        >
                          {trace.duration_ms >= 1000
                            ? `${(trace.duration_ms / 1000).toFixed(2)}s`
                            : `${trace.duration_ms}ms`}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#86868b]">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isError ? "bg-[#ff3b30]" : "bg-[#30d158]"
                            }`}
                          />
                          <span className={isError ? "text-[#dc2626]" : "text-[#28a745]"}>
                            {trace.status_code || (isError ? "500" : "200")}
                          </span>
                          <span>·</span>
                          <span>{trace.span_count} spans</span>
                        </span>
                        <span>{formatTraceTime(trace.start_time)}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Timeline Canvas & Inspector */}
          <div className="flex flex-1 flex-col overflow-hidden bg-white">
            {isLoadingDetail ? (
              <div className="flex flex-1 items-center justify-center text-[13px] text-[#86868b]">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-[#0071e3]" />
                Loading trace waterfall…
              </div>
            ) : selectedTraceDetail ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* 1. Header Bar: Trace Meta & Mode Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-[#fbfbfd] px-6 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="truncate text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
                      {selectedTraceDetail.root_name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(selectedTraceDetail.trace_id, selectedTraceDetail.trace_id)
                      }
                      title="Copy full trace ID"
                      className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-0.5 font-mono text-[11px] text-[#6e6e73] transition-colors hover:bg-black/[0.08]"
                    >
                      {copiedId === selectedTraceDetail.trace_id ? (
                        <>
                          <Check className="h-3 w-3 text-[#28a745]" />
                          <span className="text-[#28a745]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>#{selectedTraceDetail.trace_id.substring(0, 8)}…</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mode switcher: Timeline vs Operations */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-full bg-black/[0.05] p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setViewMode("timeline")}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                          viewMode === "timeline"
                            ? "bg-white text-[#1d1d1f] shadow-sm"
                            : "text-[#6e6e73] hover:text-[#1d1d1f]"
                        }`}
                      >
                        <ListTree className="h-3 w-3" />
                        <span>Timeline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("operations")}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                          viewMode === "operations"
                            ? "bg-white text-[#1d1d1f] shadow-sm"
                            : "text-[#6e6e73] hover:text-[#1d1d1f]"
                        }`}
                      >
                        <BarChart2 className="h-3 w-3" />
                        <span>Breakdown</span>
                      </button>
                    </div>

                    <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-[#1d1d1f]">
                      {selectedTraceDetail.duration_ms >= 1000
                        ? `${(selectedTraceDetail.duration_ms / 1000).toFixed(2)}s`
                        : `${selectedTraceDetail.duration_ms}ms`}
                    </span>
                  </div>
                </div>

                {/* 2. BODY: Either Operations Breakdown OR Calibrated Timeline */}
                {viewMode === "operations" ? (
                  /* VIEW A: Operations Summary Breakdown (Clean Apple Cards) */
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    <div className="flex items-center justify-between text-[12px] text-[#86868b]">
                      <span>Operations profile ({operationsBreakdown.length} distinct calls)</span>
                      <span>Sorted by total runtime</span>
                    </div>

                    {operationsBreakdown.map((op) => {
                      const pctOfTotal = Math.min(
                        100,
                        Math.max(2, (op.totalDuration / totalDurationMs) * 100)
                      )
                      const isError = op.errorCount > 0

                      return (
                        <div
                          key={op.name}
                          className="rounded-2xl border border-black/[0.06] bg-[#fbfbfd] p-4 transition-all hover:border-black/[0.12] hover:bg-white hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  isError ? "bg-[#ff3b30]" : "bg-[#30d158]"
                                }`}
                              />
                              <span className="font-mono text-[13px] font-semibold text-[#1d1d1f]">
                                {op.name}
                              </span>
                            </div>

                            <span className="font-mono text-[12px] font-semibold tabular-nums text-[#1d1d1f]">
                              {op.totalDuration >= 1000
                                ? `${(op.totalDuration / 1000).toFixed(2)}s total`
                                : `${op.totalDuration.toFixed(1)}ms total`}
                            </span>
                          </div>

                          {/* Progress track */}
                          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                            <div
                              style={{ width: `${pctOfTotal}%` }}
                              className={`h-full rounded-full ${
                                isError ? "bg-[#ff3b30]" : "bg-[#0071e3]"
                              }`}
                            />
                          </div>

                          {/* Stats footer */}
                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#86868b]">
                            <span>
                              {op.count} {op.count === 1 ? "call" : "calls"}
                              {op.errorCount > 0 && (
                                <strong className="ml-1.5 text-[#dc2626]">
                                  ({op.errorCount} failed)
                                </strong>
                              )}
                            </span>
                            <span className="font-mono tabular-nums">
                              avg {(op.totalDuration / op.count).toFixed(1)}ms · min {op.minDuration.toFixed(1)}ms · max {op.maxDuration.toFixed(1)}ms
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* VIEW B: Calibrated Gantt Waterfall Timeline */
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Time Ruler */}
                    <div className="relative flex select-none items-center border-b border-black/[0.06] bg-[#fbfbfd] px-6 py-2">
                      <div className="w-[260px] shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                        Operation Tree
                      </div>
                      <div className="relative flex flex-1 justify-between pr-4 font-mono text-[11px] tabular-nums text-[#86868b]">
                        <span>0ms</span>
                        <span>{Math.round(totalDurationMs * 0.25)}ms</span>
                        <span>{Math.round(totalDurationMs * 0.5)}ms</span>
                        <span>{Math.round(totalDurationMs * 0.75)}ms</span>
                        <span>{Math.round(totalDurationMs)}ms</span>
                      </div>
                    </div>

                    {/* Timeline Rows Container */}
                    <div className="relative flex-1 overflow-y-auto px-6 py-2 space-y-0.5 select-none">
                      {/* Vertical guide lines */}
                      <div className="pointer-events-none absolute inset-y-0 left-[284px] right-10 grid grid-cols-4 border-r border-black/[0.03]">
                        <div className="border-l border-black/[0.03]" />
                        <div className="border-l border-black/[0.03]" />
                        <div className="border-l border-black/[0.03]" />
                        <div className="border-l border-black/[0.03]" />
                      </div>

                      {processedSpans.slice(0, 150).map((span, idx) => {
                        const offsetMs =
                          span.offset_ms ??
                          Math.max(0, new Date(span.start_time).getTime() - earliestStartNs)
                        const leftPct = Math.min(
                          94,
                          Math.max(0, (offsetMs / totalDurationMs) * 100)
                        )
                        const widthPct = Math.min(
                          100 - leftPct,
                          Math.max(1.5, (span.duration_ms / totalDurationMs) * 100)
                        )

                        const isSpanSelected = selectedSpan?.span_id === span.span_id
                        const isError = span.status.includes("ERROR")
                        const isSlow = span.duration_ms >= 50
                        const isChild = span.parent_id !== null

                        // Capsule color (Apple calm palette)
                        const barColor = isError
                          ? "bg-[#ff3b30]"
                          : isSlow
                          ? "bg-[#ff9f0a]"
                          : idx === 0
                          ? "bg-[#0071e3]"
                          : "bg-[#5e5ce6]"

                        return (
                          <div
                            key={span.span_id}
                            onClick={() => setSelectedSpan(span)}
                            className={`group relative flex cursor-pointer items-center rounded-lg px-2 py-1.5 transition-colors ${
                              isSpanSelected
                                ? "bg-[#0071e3]/[0.08]"
                                : "hover:bg-[#f5f5f7]"
                            }`}
                          >
                            {/* Left: Operation name */}
                            <div
                              className="flex w-[250px] shrink-0 items-center gap-1.5 pr-3 min-w-0"
                              style={{ paddingLeft: isChild ? "18px" : "0px" }}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  isError
                                    ? "bg-[#ff3b30]"
                                    : isSlow
                                    ? "bg-[#ff9f0a]"
                                    : "bg-[#0071e3]"
                                }`}
                              />
                              <span
                                title={span.name}
                                className={`truncate font-mono text-[12px] ${
                                  isSpanSelected
                                    ? "font-semibold text-[#0071e3]"
                                    : "text-[#1d1d1f]"
                                }`}
                              >
                                {span.name}
                              </span>
                            </div>

                            {/* Right: Sleek thin timeline bar */}
                            <div className="relative flex flex-1 items-center">
                              <div
                                style={{
                                  marginLeft: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                }}
                                className={`h-2 rounded-full ${barColor} transition-all`}
                              />
                              <span className="ml-2 font-mono text-[10.5px] tabular-nums text-[#86868b] select-none">
                                {span.duration_ms}ms
                              </span>
                            </div>
                          </div>
                        )
                      })}

                      {processedSpans.length > 150 && (
                        <div className="py-3 text-center text-[12px] text-[#86868b]">
                          Showing 150 of {processedSpans.length} spans. Switch to{" "}
                          <strong className="text-[#0071e3]">Breakdown</strong> view to inspect grouped aggregates.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Bottom Inspector: Apple Instruments Clean Inspector Sheet */}
                <div className="h-[200px] shrink-0 border-t border-black/[0.06] bg-[#fbfbfd] p-4 flex flex-col">
                  {/* Inspector Header with Tabs */}
                  <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                        Span Inspector
                      </span>
                      {selectedSpan && (
                        <span className="font-mono text-[11px] text-[#0071e3]">
                          #{selectedSpan.span_id}
                        </span>
                      )}
                    </div>

                    {selectedSpan && (
                      <div className="flex items-center rounded-full bg-black/[0.05] p-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setInspectorTab("overview")}
                          className={`rounded-full px-3 py-0.5 font-medium transition-colors ${
                            inspectorTab === "overview"
                              ? "bg-white text-[#1d1d1f] shadow-sm"
                              : "text-[#6e6e73] hover:text-[#1d1d1f]"
                          }`}
                        >
                          Overview
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectorTab("attributes")}
                          className={`rounded-full px-3 py-0.5 font-medium transition-colors ${
                            inspectorTab === "attributes"
                              ? "bg-white text-[#1d1d1f] shadow-sm"
                              : "text-[#6e6e73] hover:text-[#1d1d1f]"
                          }`}
                        >
                          Attributes ({Object.keys(selectedSpan.attributes).length})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inspector Content */}
                  {selectedSpan ? (
                    <div className="flex-1 overflow-y-auto pt-2.5">
                      {inspectorTab === "overview" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="rounded-xl border border-black/[0.04] bg-white p-2.5">
                            <p className="text-[10.5px] font-medium text-[#86868b] uppercase">Operation</p>
                            <p className="mt-0.5 truncate font-mono text-[12px] font-semibold text-[#1d1d1f]">
                              {selectedSpan.name}
                            </p>
                          </div>

                          <div className="rounded-xl border border-black/[0.04] bg-white p-2.5">
                            <p className="text-[10.5px] font-medium text-[#86868b] uppercase">Duration</p>
                            <p className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-[#1d1d1f]">
                              {selectedSpan.duration_ms} ms
                            </p>
                          </div>

                          <div className="rounded-xl border border-black/[0.04] bg-white p-2.5">
                            <p className="text-[10.5px] font-medium text-[#86868b] uppercase">Status</p>
                            <p
                              className={`mt-0.5 text-[12px] font-semibold ${
                                selectedSpan.status.includes("ERROR")
                                  ? "text-[#dc2626]"
                                  : "text-[#28a745]"
                              }`}
                            >
                              {selectedSpan.status.includes("ERROR") ? "Fault / Error" : "Success"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-black/[0.04] bg-white p-2.5">
                            <p className="text-[10.5px] font-medium text-[#86868b] uppercase">Offset</p>
                            <p className="mt-0.5 font-mono text-[12px] tabular-nums text-[#1d1d1f]">
                              +{selectedSpan.offset_ms ?? 0} ms
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-black/[0.04] bg-white p-2">
                          {Object.keys(selectedSpan.attributes).length === 0 ? (
                            <p className="py-2 text-center text-[12px] text-[#86868b]">
                              No telemetry attributes recorded on this span.
                            </p>
                          ) : (
                            <table className="w-full text-left text-[11px] font-mono">
                              <thead>
                                <tr className="border-b border-black/[0.04] text-[10px] text-[#86868b] uppercase">
                                  <th className="pb-1 pl-1">Key</th>
                                  <th className="pb-1 pr-1">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/[0.02]">
                                {Object.entries(selectedSpan.attributes).map(([k, v]) => (
                                  <tr key={k}>
                                    <td className="py-1 pl-1 text-[#0071e3]">{k}</td>
                                    <td className="py-1 pr-1 text-[#1d1d1f] truncate max-w-[340px]">
                                      {String(v)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-16 items-center justify-center text-[12px] text-[#86868b]">
                      Select any span row above to inspect attributes and runtime metrics.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-[13px] text-[#86868b]">
                Select a trace from the left navigator to inspect execution waterfall.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default TraceWaterfallViewer
