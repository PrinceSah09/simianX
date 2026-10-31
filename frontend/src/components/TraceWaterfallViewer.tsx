import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  Clock,
  Copy,
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
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedTraceId

  const loadTraces = async () => {
    setIsLoadingTraces(true)
    try {
      const data = await fetchTraces(40)
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
      <div className="flex flex-col gap-5 rounded-[28px] bg-white px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <div>
          <h2 className="text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f] sm:text-[40px]">
            Traces
          </h2>
          <p className="mt-1 text-[14px] text-[#6e6e73]">
            OpenTelemetry distributed spans, execution waterfalls, and latency inspection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              placeholder="Filter trace ID, endpoint..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="h-9 w-56 rounded-full bg-[#f5f5f7] pl-8 pr-4 text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none"
            />
          </div>
          <button
            onClick={loadTraces}
            disabled={isLoadingTraces}
            className="inline-flex items-center gap-1.5 text-[15px] text-[#0066cc] hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTraces ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid: Left Traces List, Right Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Recent Traces Stream */}
        <div className="flex h-[580px] flex-col rounded-[28px] bg-white p-4 lg:col-span-4">
          <div className="mb-2 flex items-center justify-between border-b border-black/[0.08] px-2 pb-3">
            <span className="text-[13px] text-[#6e6e73]">
              {filteredTraces.length} traces
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredTraces.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-[15px] text-[#6e6e73]">
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
                    className={`w-full rounded-2xl px-3 py-3 text-left transition-colors ${
                      isSelected ? "bg-[#f5f5f7]" : "hover:bg-[#f5f5f7]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="max-w-[190px] truncate text-[15px] font-medium text-[#1d1d1f]">
                        {trace.root_name}
                      </span>
                      <span
                        className={`text-[13px] ${isError ? "text-[#ff3b30]" : "text-[#6e6e73]"}`}
                      >
                        {trace.status_code || (isError ? "500" : "200")}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[12px] text-[#86868b]">
                      <span className="max-w-[120px] truncate">
                        {trace.trace_id.substring(0, 12)}...
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1d1d1f]">{trace.duration_ms} ms</span>
                        <span>{trace.span_count} spans</span>
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
          <div className="flex min-h-[340px] flex-col rounded-[28px] bg-white p-5">
            {isLoadingDetail ? (
              <div className="flex flex-1 items-center justify-center text-[15px] text-[#6e6e73]">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading trace spans...
              </div>
            ) : selectedTraceDetail ? (
              <div className="flex flex-col flex-1">
                {/* Trace Banner Info */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="max-w-[280px] truncate text-[13px] font-medium text-[#1d1d1f]">
                      Trace: {selectedTraceDetail.trace_id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedTraceDetail.trace_id)}
                      className="rounded p-1 text-[#86868b] hover:text-[#1d1d1f]"
                      title="Copy Trace ID"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#0071e3]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-[13px] text-[#6e6e73]">
                    <span>{selectedTraceDetail.duration_ms} ms</span>
                    <span>{selectedTraceDetail.spans.length} spans</span>
                  </div>
                </div>

                {/* Timeline Ruler */}
                <div className="relative mb-3 flex h-6 select-none justify-between border-b border-black/[0.08] px-1 text-[11px] text-[#86868b]">
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
                        className={`cursor-pointer rounded-2xl p-3 transition-colors ${
                          isSpanSelected ? "bg-[#f5f5f7]" : "hover:bg-[#f5f5f7]"
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
                            <span className="font-medium tracking-tight text-[#1d1d1f]">
                              {span.name}
                            </span>
                            {span.parent_id && (
                              <span className="text-[12px] text-[#86868b]">
                                (child)
                              </span>
                            )}
                          </div>
                          <span className="text-[13px] text-[#6e6e73]">
                            {span.duration_ms} ms
                          </span>
                        </div>

                        {/* Waterfall track & bar */}
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#e8e8ed]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{ marginLeft: `${leftPct}%` }}
                            className={`h-full rounded-full ${isError ? "bg-[#ff3b30]" : "bg-[#0071e3]"}`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-[15px] text-[#6e6e73]">
                Select a trace.
              </div>
            )}
          </div>

          {/* Bottom Panel: Apple Span Inspector Sheet */}
          <div className="min-h-[220px] rounded-[28px] bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b border-black/[0.08] pb-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
                Span
              </p>
              {selectedSpan && (
                <span className="text-[12px] text-[#86868b]">{selectedSpan.span_id}</span>
              )}
            </div>

            {selectedSpan ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Meta details */}
                <div className="space-y-2 rounded-2xl bg-[#f5f5f7] p-4 text-[14px]">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#6e6e73]">Operation</span>
                    <span className="font-medium">{selectedSpan.name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#6e6e73]">Duration</span>
                    <span>{selectedSpan.duration_ms} ms</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#6e6e73]">Status</span>
                    <span className={selectedSpan.status.includes("ERROR") ? "text-[#ff3b30]" : "text-[#1d1d1f]"}>
                      {selectedSpan.status}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#6e6e73]">Start</span>
                    <span>
                      {selectedSpan.start_time.split("T")[1]?.replace("Z", "")}
                    </span>
                  </div>
                </div>

                {/* Attributes breakdown */}
                <div className="max-h-[140px] overflow-y-auto rounded-2xl bg-[#f5f5f7] p-4">
                  <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
                    Attributes
                  </span>
                  {Object.keys(selectedSpan.attributes).length === 0 ? (
                    <span className="text-[14px] text-[#86868b]">None</span>
                  ) : (
                    <div className="space-y-1 text-[13px]">
                      {Object.entries(selectedSpan.attributes).map(([key, val]) => (
                        <div key={key} className="flex justify-between gap-3">
                          <span className="max-w-[140px] truncate text-[#0066cc]">{key}</span>
                          <span className="max-w-[180px] truncate text-[#1d1d1f]">
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center text-[15px] text-[#6e6e73]">
                Select any span above to inspect its metadata and telemetry tags.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
