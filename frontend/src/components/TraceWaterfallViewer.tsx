import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  Clock,
  Copy,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  Activity,
} from "lucide-react"
import { fetchTraceDetail, fetchTraces } from "../services/api"
import type { SpanDetail, TraceDetail, TraceSummaryItem } from "../types/experiment"

interface TraceWaterfallViewerProps {
  onSelectTrace?: (traceId: string) => void
}

type TraceFilter = "all" | "chaos" | "slow" | "errors"

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
    const interval = setInterval(loadTraces, 3500)
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

  // Filter traces by segment and search query
  const filteredTraces = traces.filter((t) => {
    // 1. Text search
    const matchesQuery =
      t.trace_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.root_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.scenario.toLowerCase().includes(filterQuery.toLowerCase())
    if (!matchesQuery) return false

    // 2. Segment filter
    const isError = t.status === "ERROR" || t.status_code >= 400
    const isSlow = t.duration_ms >= 50
    const isChaos = t.scenario !== "standard" || t.root_name.toLowerCase().includes("chaos")

    if (activeFilter === "errors") return isError
    if (activeFilter === "slow") return isSlow
    if (activeFilter === "chaos") return isChaos
    return true
  })

  // Timeline scale calculation
  const totalDurationMs = selectedTraceDetail
    ? Math.max(selectedTraceDetail.duration_ms, 1)
    : 100

  // Earliest span start time fallback for offset calculation
  const earliestStartNs = selectedTraceDetail?.spans.length
    ? Math.min(...selectedTraceDetail.spans.map((s) => new Date(s.start_time).getTime()))
    : 0

  return (
    <div className="w-full">
      {/* Unified Single Apple macOS / Instruments Style Window */}
      <div className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Top Window Toolbar (Apple Cupertino Sleek Header) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] bg-[#fbfbfd] px-6 py-3.5">
          {/* Left: Window Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0071e3]/10 text-[#0071e3]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
                Distributed Traces
              </h2>
            </div>
            <span className="rounded-full bg-black/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-[#6e6e73]">
              {filteredTraces.length} recorded
            </span>
          </div>

          {/* Right Toolbar Controls: Filter Segments + Search + Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Apple Segmented Pill */}
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
                      isSelected ? "text-[#1d1d1f]" : "text-[#6e6e73] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeTraceTabPill"
                        className="absolute inset-0 rounded-full bg-white shadow-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                )
              })}
            </div>

            {/* Apple Pill Search Field */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
              <input
                type="text"
                placeholder="Search traces…"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="h-8 w-44 sm:w-52 rounded-full bg-black/[0.05] pl-8 pr-3 text-[12px] text-[#1d1d1f] placeholder:text-[#86868b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
              />
            </div>

            {/* Tactile Refresh Pill Button */}
            <button
              type="button"
              onClick={loadTraces}
              disabled={isLoadingTraces}
              title="Refresh traces"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-[#1d1d1f] transition-all hover:bg-black/[0.08] active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#6e6e73] ${isLoadingTraces ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Unified 2-Pane Workstation: Left Sidebar + Right Timeline Canvas */}
        <div className="flex flex-col lg:flex-row h-[700px] overflow-hidden">
          {/* LEFT PANE: Trace Navigator Sidebar (macOS Mail / Notes Style) */}
          <div className="flex w-full lg:w-[310px] shrink-0 flex-col border-b lg:border-b-0 lg:border-r border-black/[0.06] bg-[#fafafc]">
            <div className="flex items-center justify-between border-b border-black/[0.04] px-4 py-2.5 text-[11px] font-medium text-[#86868b]">
              <span>Traces ({filteredTraces.length})</span>
              <span>Latest first</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-black/[0.03] select-none">
              {filteredTraces.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center px-4 text-center text-[#86868b]">
                  <Clock className="mb-2 h-7 w-7 opacity-30" />
                  <p className="text-[13px] font-medium text-[#1d1d1f]">No traces match</p>
                  <p className="mt-1 text-[11px]">
                    Run a scenario from the Studio to record distributed OpenTelemetry spans.
                  </p>
                </div>
              ) : (
                filteredTraces.map((trace) => {
                  const isSelected = trace.trace_id === selectedTraceId
                  const isError = trace.status === "ERROR" || trace.status_code >= 400
                  const isSlow = trace.duration_ms >= 150

                  return (
                    <button
                      key={trace.trace_id}
                      type="button"
                      onClick={() => setSelectedTraceId(trace.trace_id)}
                      className={`w-full p-3.5 text-left transition-all duration-150 ${
                        isSelected
                          ? "bg-[#0071e3]/[0.08] text-[#1d1d1f]"
                          : "hover:bg-black/[0.025] text-[#1d1d1f]"
                      }`}
                    >
                      {/* Top Row: Title + Duration */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-[13px] font-semibold tracking-tight ${
                            isSelected ? "text-[#0071e3]" : "text-[#1d1d1f]"
                          }`}
                        >
                          {trace.root_name}
                        </span>
                        <span
                          className={`shrink-0 font-mono text-[12px] font-semibold tabular-nums ${
                            isSlow ? "text-[#ff9f0a]" : "text-[#1d1d1f]"
                          }`}
                        >
                          {trace.duration_ms} ms
                        </span>
                      </div>

                      {/* Bottom Row: Status Dot + Span Count + Relative Time */}
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
                          <span>{trace.span_count} {trace.span_count === 1 ? "span" : "spans"}</span>
                        </span>
                        <span>{formatTraceTime(trace.start_time)}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Timeline Waterfall & Span Inspector Canvas */}
          <div className="flex flex-1 flex-col overflow-hidden bg-white">
            {isLoadingDetail ? (
              <div className="flex flex-1 items-center justify-center text-[13px] text-[#86868b]">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-[#0071e3]" />
                Loading trace waterfall…
              </div>
            ) : selectedTraceDetail ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* 1. Header Bar: Trace Meta & One-Click Copy */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-white px-6 py-3.5">
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 font-mono text-[11px] text-[#6e6e73] transition-colors hover:bg-black/[0.08] hover:text-[#1d1d1f]"
                    >
                      {copiedId === selectedTraceDetail.trace_id ? (
                        <>
                          <Check className="h-3 w-3 text-[#28a745]" />
                          <span className="text-[#28a745]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>#{selectedTraceDetail.trace_id.substring(0, 10)}…</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="rounded-full bg-black/[0.04] px-2.5 py-1 font-mono font-medium tabular-nums text-[#1d1d1f]">
                      {selectedTraceDetail.duration_ms} ms total
                    </span>
                    <span className="rounded-full bg-black/[0.04] px-2.5 py-1 font-medium text-[#1d1d1f]">
                      {selectedTraceDetail.spans.length} spans
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium ${
                        selectedTraceDetail.status === "ERROR"
                          ? "bg-[#ff3b30]/10 text-[#dc2626]"
                          : "bg-[#34c759]/10 text-[#28a745]"
                      }`}
                    >
                      {selectedTraceDetail.status}
                    </span>
                  </div>
                </div>

                {/* 2. Apple Instruments Synchronized Timeline Ruler */}
                <div className="relative flex select-none items-center border-b border-black/[0.06] bg-[#fbfbfd] px-6 py-2">
                  <div className="w-[230px] shrink-0 text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
                    Span Hierarchy
                  </div>
                  <div className="relative flex flex-1 justify-between pr-4 font-mono text-[11px] tabular-nums text-[#86868b]">
                    <span>0 ms</span>
                    <span>{Math.round(totalDurationMs * 0.25)} ms</span>
                    <span>{Math.round(totalDurationMs * 0.5)} ms</span>
                    <span>{Math.round(totalDurationMs * 0.75)} ms</span>
                    <span>{Math.round(totalDurationMs)} ms</span>
                  </div>
                </div>

                {/* 3. The Waterfall Spans Tree Area (With Synchronized Vertical Grid Lines) */}
                <div className="relative flex-1 overflow-y-auto px-6 py-3 space-y-1 select-none">
                  {/* Vertical Guide Lines Aligned with Ruler Ticks */}
                  <div className="pointer-events-none absolute inset-y-0 left-[254px] right-10 grid grid-cols-4 border-r border-black/[0.03]">
                    <div className="border-l border-black/[0.03]" />
                    <div className="border-l border-black/[0.03]" />
                    <div className="border-l border-black/[0.03]" />
                    <div className="border-l border-black/[0.03]" />
                  </div>

                  {/* Span Rows */}
                  {selectedTraceDetail.spans.map((span, idx) => {
                    const offsetMs =
                      span.offset_ms ??
                      Math.max(0, new Date(span.start_time).getTime() - earliestStartNs)
                    const leftPct = Math.min(
                      92,
                      Math.max(0, (offsetMs / totalDurationMs) * 100)
                    )
                    const widthPct = Math.min(
                      100 - leftPct,
                      Math.max(4, (span.duration_ms / totalDurationMs) * 100)
                    )

                    const isSpanSelected = selectedSpan?.span_id === span.span_id
                    const isError = span.status.includes("ERROR")
                    const isSlow = span.duration_ms >= 150
                    const isChild = span.parent_id !== null

                    // Capsule bar color
                    const barBg = isError
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
                        className={`group relative flex cursor-pointer items-center rounded-xl px-2.5 py-1.5 transition-all duration-150 ${
                          isSpanSelected
                            ? "bg-[#0071e3]/[0.08] ring-1 ring-[#0071e3]/20"
                            : "hover:bg-[#f5f5f7]"
                        }`}
                      >
                        {/* Left Column: Span Name & Guide Tree */}
                        <div
                          className="flex w-[220px] shrink-0 items-center gap-2 min-w-0 pr-3"
                          style={{ paddingLeft: isChild ? "16px" : "0px" }}
                        >
                          {isChild && (
                            <span className="font-mono text-[11px] text-[#86868b] select-none">
                              └─
                            </span>
                          )}
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              isError
                                ? "bg-[#ff3b30]"
                                : isSlow
                                ? "bg-[#ff9f0a]"
                                : idx === 0
                                ? "bg-[#0071e3]"
                                : "bg-[#5e5ce6]"
                            }`}
                          />
                          <span
                            title={span.name}
                            className={`truncate text-[12.5px] font-medium tracking-tight ${
                              isSpanSelected ? "text-[#0071e3]" : "text-[#1d1d1f]"
                            }`}
                          >
                            {span.name}
                          </span>
                        </div>

                        {/* Right Column: Timeline Capsule Track & Bar */}
                        <div className="relative flex flex-1 items-center py-1">
                          <div
                            style={{
                              marginLeft: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                            className={`flex h-5 shrink-0 items-center rounded-full ${barBg} px-2 shadow-sm transition-all duration-200`}
                          >
                            {widthPct > 15 ? (
                              <span className="truncate font-mono text-[10px] font-medium text-white select-none">
                                {span.duration_ms}ms
                              </span>
                            ) : null}
                          </div>

                          {widthPct <= 15 ? (
                            <span className="ml-1.5 font-mono text-[10.5px] font-medium tabular-nums text-[#86868b] select-none">
                              {span.duration_ms}ms
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 4. Bottom Span Inspector (macOS Native Bottom Sheet Style) */}
                <div className="h-[210px] shrink-0 border-t border-black/[0.06] bg-[#fbfbfd] p-4 flex flex-col">
                  {/* Inspector Header with Tab Pills */}
                  <div className="flex items-center justify-between border-b border-black/[0.04] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
                        Span Inspector
                      </span>
                      {selectedSpan && (
                        <span className="font-mono text-[11px] text-[#86868b]">
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

                  {/* Inspector Body */}
                  {selectedSpan ? (
                    <div className="flex-1 overflow-y-auto pt-3">
                      {selectedSpan.status.includes("ERROR") && (
                        <div className="mb-2.5 flex items-center gap-2 rounded-xl bg-[#ff3b30]/10 p-2.5 text-[#dc2626]">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <p className="text-[12px] font-medium leading-snug">
                            {selectedSpan.status}
                          </p>
                        </div>
                      )}

                      {inspectorTab === "overview" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="rounded-xl border border-black/[0.04] bg-white p-3 shadow-sm">
                            <p className="text-[11px] font-medium text-[#86868b]">Operation</p>
                            <p className="mt-1 truncate text-[13px] font-semibold text-[#1d1d1f]">
                              {selectedSpan.name}
                            </p>
                          </div>

                          <div className="rounded-xl border border-black/[0.04] bg-white p-3 shadow-sm">
                            <p className="text-[11px] font-medium text-[#86868b]">Duration</p>
                            <p className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-[#1d1d1f]">
                              {selectedSpan.duration_ms} ms
                            </p>
                          </div>

                          <div className="rounded-xl border border-black/[0.04] bg-white p-3 shadow-sm">
                            <p className="text-[11px] font-medium text-[#86868b]">Status</p>
                            <p
                              className={`mt-1 text-[13px] font-semibold ${
                                selectedSpan.status.includes("ERROR")
                                  ? "text-[#dc2626]"
                                  : "text-[#28a745]"
                              }`}
                            >
                              {selectedSpan.status.includes("ERROR") ? "Failed" : "Success (OK)"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-black/[0.04] bg-white p-3 shadow-sm">
                            <p className="text-[11px] font-medium text-[#86868b]">Hierarchy</p>
                            <p className="mt-1 text-[13px] font-medium text-[#1d1d1f]">
                              {selectedSpan.parent_id ? "Child span" : "Root span"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-black/[0.04] bg-white p-2.5 shadow-sm">
                          {Object.keys(selectedSpan.attributes).length === 0 ? (
                            <p className="py-3 text-center text-[12px] text-[#86868b]">
                              No telemetry attributes recorded on this span.
                            </p>
                          ) : (
                            <table className="w-full text-left text-[11.5px]">
                              <thead>
                                <tr className="border-b border-black/[0.04] text-[10.5px] font-medium text-[#86868b]">
                                  <th className="pb-1 pl-1.5">Attribute Key</th>
                                  <th className="pb-1 pr-1.5">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/[0.025]">
                                {Object.entries(selectedSpan.attributes).map(([key, val]) => (
                                  <tr key={key} className="hover:bg-black/[0.02]">
                                    <td className="py-1 pl-1.5 font-mono font-medium text-[#0066cc]">
                                      {key}
                                    </td>
                                    <td className="py-1 pr-1.5 font-mono text-[#1d1d1f] max-w-[360px] truncate">
                                      {String(val)}
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
                    <div className="flex h-20 items-center justify-center text-[12px] text-[#86868b]">
                      Select any span row above to inspect its execution attributes.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-[13px] text-[#86868b]">
                Select a trace from the left navigator to view its execution timeline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TraceWaterfallViewer
