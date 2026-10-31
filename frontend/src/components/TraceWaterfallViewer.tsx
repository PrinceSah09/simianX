import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  Layers,
  RefreshCw,
  Search,
} from "lucide-react"
import { fetchTraceDetail, fetchTraces } from "../services/api"
import type { SpanDetail, TraceDetail, TraceSummaryItem } from "../types/experiment"

interface TraceWaterfallViewerProps {
  onSelectTrace?: (traceId: string) => void
}

export const TraceWaterfallViewer: React.FC<TraceWaterfallViewerProps> = () => {
  const [traces, setTraces] = useState<TraceSummaryItem[]>([])
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [selectedTraceDetail, setSelectedTraceDetail] = useState<TraceDetail | null>(null)
  const [selectedSpan, setSelectedSpan] = useState<SpanDetail | null>(null)
  const [isLoadingTraces, setIsLoadingTraces] = useState<boolean>(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false)
  const [filterQuery, setFilterQuery] = useState<string>("")
  const [copied, setCopied] = useState<boolean>(false)

  const loadTraces = async () => {
    setIsLoadingTraces(true)
    try {
      const data = await fetchTraces(40)
      setTraces(data)
      if (data.length > 0 && !selectedTraceId) {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredTraces = traces.filter(
    (t) =>
      t.trace_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.root_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.scenario.toLowerCase().includes(filterQuery.toLowerCase())
  )

  // Timeline calculation
  const totalDurationMs = selectedTraceDetail
    ? Math.max(selectedTraceDetail.duration_ms, 1)
    : 100

  // Earliest span start time
  const earliestStartNs = selectedTraceDetail?.spans.length
    ? Math.min(
        ...selectedTraceDetail.spans.map((s) => new Date(s.start_time).getTime())
      )
    : 0

  return (
    <div className="space-y-4">
      {/* Apple-grade Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-zinc-900/60 p-4 border border-white/[0.08] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                OpenTelemetry Distributed Tracing
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live OTLP
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive span waterfall and causality graph powered by OpenTelemetry SDK & Grafana Alloy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter trace ID, endpoint, scenario..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="h-8 w-60 rounded-lg bg-zinc-950/80 pl-8 pr-3 text-xs text-white placeholder-zinc-500 border border-white/10 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <button
            onClick={loadTraces}
            disabled={isLoadingTraces}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] px-3 text-xs font-medium text-zinc-300 border border-white/10 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingTraces ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid: Left Traces List, Right Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Recent Traces Stream */}
        <div className="lg:col-span-4 rounded-2xl bg-zinc-900/60 p-3.5 border border-white/[0.08] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] px-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Recorded Traces ({filteredTraces.length})
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">ring buffer: 200</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredTraces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500 text-xs">
                <Clock className="h-6 w-6 mb-2 opacity-40" />
                No traces match your filter or buffer is empty.
              </div>
            ) : (
              filteredTraces.map((trace) => {
                const isSelected = trace.trace_id === selectedTraceId
                const isError = trace.status === "ERROR" || trace.status_code >= 400

                return (
                  <button
                    key={trace.trace_id}
                    onClick={() => setSelectedTraceId(trace.trace_id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500/40 shadow-sm"
                        : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white truncate max-w-[190px]">
                        {trace.root_name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                          isError
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {trace.status_code || (isError ? "500" : "200")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span className="truncate max-w-[120px] text-zinc-500">
                        {trace.trace_id.substring(0, 12)}...
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-300 font-medium">{trace.duration_ms}ms</span>
                        <span className="text-zinc-500">({trace.span_count} spans)</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Waterfall Visualizer & Span Inspector */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Top Panel: Waterfall Timeline Graph */}
          <div className="rounded-2xl bg-zinc-900/60 p-4 border border-white/[0.08] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] min-h-[340px] flex flex-col">
            {isLoadingDetail ? (
              <div className="flex flex-1 items-center justify-center text-zinc-500 text-xs">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading trace spans...
              </div>
            ) : selectedTraceDetail ? (
              <div className="flex flex-col flex-1">
                {/* Trace Banner Info */}
                <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-white/[0.06] gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white font-mono">
                      Trace: {selectedTraceDetail.trace_id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedTraceDetail.trace_id)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Copy Trace ID"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-zinc-400">
                      Total Latency:{" "}
                      <span className="text-white font-semibold">
                        {selectedTraceDetail.duration_ms} ms
                      </span>
                    </span>
                    <span className="text-zinc-400">
                      Spans:{" "}
                      <span className="text-white font-semibold">
                        {selectedTraceDetail.spans.length}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Timeline Ruler */}
                <div className="relative h-6 border-b border-white/[0.08] text-[10px] text-zinc-500 font-mono flex justify-between px-2 mb-2 select-none">
                  <span>0ms</span>
                  <span>{Math.round(totalDurationMs * 0.25)}ms</span>
                  <span>{Math.round(totalDurationMs * 0.5)}ms</span>
                  <span>{Math.round(totalDurationMs * 0.75)}ms</span>
                  <span>{Math.round(totalDurationMs)}ms</span>
                </div>

                {/* Spans List & Waterfall Bars */}
                <div className="space-y-2 overflow-y-auto max-h-[240px] pr-1">
                  {selectedTraceDetail.spans.map((span, idx) => {
                    const spanStart = new Date(span.start_time).getTime()
                    const offsetMs = Math.max(0, spanStart - earliestStartNs)
                    const leftPct = Math.min(95, Math.max(0, (offsetMs / totalDurationMs) * 100))
                    const widthPct = Math.min(
                      100 - leftPct,
                      Math.max(2, (span.duration_ms / totalDurationMs) * 100)
                    )

                    const isSpanSelected = selectedSpan?.span_id === span.span_id
                    const isError = span.status.includes("ERROR")

                    return (
                      <div
                        key={span.span_id}
                        onClick={() => setSelectedSpan(span)}
                        className={`group relative p-2 rounded-xl border transition-all cursor-pointer ${
                          isSpanSelected
                            ? "bg-white/[0.08] border-white/20 shadow-md"
                            : "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04]"
                        }`}
                      >
                        {/* Span row */}
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isError
                                  ? "bg-red-400"
                                  : idx === 0
                                  ? "bg-blue-400"
                                  : "bg-purple-400"
                              }`}
                            />
                            <span className="font-medium text-white tracking-tight">
                              {span.name}
                            </span>
                            {span.parent_id && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                (child)
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-zinc-300">
                            {span.duration_ms} ms
                          </span>
                        </div>

                        {/* Waterfall track & bar */}
                        <div className="relative h-2 w-full rounded-full bg-zinc-950/80 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{ marginLeft: `${leftPct}%` }}
                            className={`h-full rounded-full ${
                              isError
                                ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                : idx === 0
                                ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                : "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-zinc-500 text-xs">
                Select a trace from the left panel to inspect the waterfall.
              </div>
            )}
          </div>

          {/* Bottom Panel: Apple Span Inspector Sheet */}
          <div className="rounded-2xl bg-zinc-900/60 p-4 border border-white/[0.08] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] min-h-[220px]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Span Attributes Inspector
                </span>
              </div>
              {selectedSpan && (
                <span className="text-xs font-mono text-zinc-400">
                  ID: <span className="text-zinc-200">{selectedSpan.span_id}</span>
                </span>
              )}
            </div>

            {selectedSpan ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Meta details */}
                <div className="space-y-2 rounded-xl bg-zinc-950/50 p-3 border border-white/[0.04]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Operation:</span>
                    <span className="font-semibold text-white">{selectedSpan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Duration:</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {selectedSpan.duration_ms} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Status:</span>
                    <span
                      className={`font-mono font-medium ${
                        selectedSpan.status.includes("ERROR")
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedSpan.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Start Time:</span>
                    <span className="font-mono text-zinc-300">
                      {selectedSpan.start_time.split("T")[1]?.replace("Z", "")}
                    </span>
                  </div>
                </div>

                {/* Attributes breakdown */}
                <div className="rounded-xl bg-zinc-950/50 p-3 border border-white/[0.04] max-h-[140px] overflow-y-auto">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    OTel Span Attributes
                  </span>
                  {Object.keys(selectedSpan.attributes).length === 0 ? (
                    <span className="text-zinc-600 italic">No custom attributes.</span>
                  ) : (
                    <div className="space-y-1 font-mono text-[11px]">
                      {Object.entries(selectedSpan.attributes).map(([key, val]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="text-blue-400/90 truncate max-w-[130px]">{key}:</span>
                          <span className="text-zinc-200 truncate max-w-[180px]">
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-28 text-zinc-500 text-xs">
                Select any span above to inspect its metadata and telemetry tags.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
