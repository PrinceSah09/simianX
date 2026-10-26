import React, { useMemo, useState } from "react"
import { Activity, Clock, ShieldCheck, Zap } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import type { Experiment, TimeSeriesPoint } from "../types/experiment"

interface TelemetryChartsProps {
  points: TimeSeriesPoint[]
  isLoading: boolean
  activeExperiment: Experiment | null
  recentExperiment: Experiment | null
  timeWindowSeconds?: number
  onWindowChange?: (seconds: number) => void
}

/**
 * Generates a smooth cubic Bézier spline string from discrete coordinate points.
 * Uses tension parameter to avoid overshooting and ensure natural curvature.
 */
function createSmoothCurve(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return ""
  if (coords.length === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
  if (coords.length === 2) {
    return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)} L ${coords[1].x.toFixed(1)} ${coords[1].y.toFixed(1)}`
  }

  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[i + 2 >= coords.length ? coords.length - 1 : i + 2]

    // 0.2 tension gives ultra-smooth spline without clipping
    const tension = 0.2
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  return d
}

/**
 * Generates a closed area ribbon under a smooth spline path.
 * Closes cleanly to bottomY to avoid any criss-crossing polygon artifacts.
 */
function createSmoothArea(coords: { x: number; y: number }[], bottomY: number): string {
  if (coords.length === 0) return ""
  const curve = createSmoothCurve(coords)
  const firstX = coords[0].x.toFixed(1)
  const lastX = coords[coords.length - 1].x.toFixed(1)
  return `${curve} L ${lastX} ${bottomY.toFixed(1)} L ${firstX} ${bottomY.toFixed(1)} Z`
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  points,
  isLoading,
  activeExperiment,
  recentExperiment,
  timeWindowSeconds = 60,
  onWindowChange,
}) => {
  const { isDark } = useTheme()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Chart dimensions & internal viewport
  const width = 360
  const height = 125
  const padding = { top: 16, right: 14, bottom: 22, left: 38 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const bottomY = padding.top + chartH

  // Total observed requests across series
  const totalObservedRequests = useMemo(
    () => points.reduce((acc, p) => acc + (p.requests || 0), 0),
    [points]
  )
  const hasData = points.length > 0 && totalObservedRequests > 0

  // 1. Throughput scaling (adaptive, min 10 req/s, 20% headroom)
  const maxRps = useMemo(() => {
    const highest = Math.max(...points.map((p) => p.rps || 0), 0)
    return Math.max(10, Math.ceil((highest * 1.2) / 10) * 10)
  }, [points])

  // 2. Latency scaling (adaptive, min 50 ms, 25% headroom to avoid ceiling collisions)
  const maxLatency = useMemo(() => {
    const validLatencies = points
      .map((p) => p.p95_latency_ms)
      .filter((v): v is number => v !== null && v > 0)
    const highest = validLatencies.length ? Math.max(...validLatencies) : 0
    return Math.max(50, Math.ceil((highest * 1.25) / 25) * 25)
  }, [points])

  // 3. Error rate scaling (adaptive, min 10%, max 100%)
  const maxErrorRate = useMemo(() => {
    const highest = Math.max(...points.map((p) => p.error_rate || 0), 0)
    return Math.max(10, Math.min(100, Math.ceil(highest / 10) * 10))
  }, [points])

  // Coordinate helper: X for index
  const getX = (index: number) => {
    if (points.length <= 1) return padding.left
    return padding.left + (index / (points.length - 1)) * chartW
  }

  // Build coordinate arrays for each metric (always continuous, no null gaps)
  const rpsCoords = useMemo(() => {
    return points.map((p, idx) => {
      const norm = Math.min(1, Math.max(0, (p.rps || 0) / maxRps))
      return {
        x: getX(idx),
        y: padding.top + chartH - norm * chartH,
      }
    })
  }, [points, maxRps, chartH, padding.top])

  const latencyCoords = useMemo(() => {
    return points.map((p, idx) => {
      // Idle seconds (0 requests) rest at baseline 0ms cleanly
      const isIdlePoint = (p.requests === 0 && p.rps === 0) || p.p95_latency_ms === null
      const val: number = isIdlePoint || p.p95_latency_ms === null ? 0 : p.p95_latency_ms
      const norm = Math.min(1, Math.max(0, val / maxLatency))
      return {
        x: getX(idx),
        y: padding.top + chartH - norm * chartH,
      }
    })
  }, [points, maxLatency, chartH, padding.top])

  const errorCoords = useMemo(() => {
    return points.map((p, idx) => {
      const norm = Math.min(1, Math.max(0, (p.error_rate || 0) / maxErrorRate))
      return {
        x: getX(idx),
        y: padding.top + chartH - norm * chartH,
      }
    })
  }, [points, maxErrorRate, chartH, padding.top])

  // SVG paths generated via smooth Bézier curves
  const rpsCurve = useMemo(() => createSmoothCurve(rpsCoords), [rpsCoords])
  const rpsArea = useMemo(() => createSmoothArea(rpsCoords, bottomY), [rpsCoords, bottomY])

  const latencyCurve = useMemo(() => createSmoothCurve(latencyCoords), [latencyCoords])
  const latencyArea = useMemo(() => createSmoothArea(latencyCoords, bottomY), [latencyCoords, bottomY])

  const errorCurve = useMemo(() => createSmoothCurve(errorCoords), [errorCoords])
  const errorArea = useMemo(() => createSmoothArea(errorCoords, bottomY), [errorCoords, bottomY])

  // Experiment event markers
  const eventMarkers = useMemo(() => {
    if (!points.length) return []
    const markers: { index: number; label: string; color: string }[] = []
    const checkExp = activeExperiment ?? recentExperiment
    if (!checkExp) return markers

    const startEpoch = checkExp.started_at
      ? new Date(checkExp.started_at).getTime() / 1000
      : null
    const endEpoch = checkExp.ended_at
      ? new Date(checkExp.ended_at).getTime() / 1000
      : null

    points.forEach((p, idx) => {
      if (startEpoch && Math.abs(p.timestamp - startEpoch) <= 0.6) {
        markers.push({ index: idx, label: "START", color: "#10b981" })
      }
      if (endEpoch && Math.abs(p.timestamp - endEpoch) <= 0.6) {
        markers.push({ index: idx, label: "END", color: "#f59e0b" })
      }
    })
    return markers
  }, [points, activeExperiment, recentExperiment])

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null
  const hoveredRpsCoord = hoverIndex !== null && rpsCoords[hoverIndex] ? rpsCoords[hoverIndex] : null
  const hoveredLatencyCoord = hoverIndex !== null && latencyCoords[hoverIndex] ? latencyCoords[hoverIndex] : null
  const hoveredErrorCoord = hoverIndex !== null && errorCoords[hoverIndex] ? errorCoords[hoverIndex] : null

  // Theme-aware SVG styling tokens
  const gridStroke = isDark ? "#262626" : "#e2e8f0"
  const baselineStroke = isDark ? "#333333" : "#cbd5e1"
  const axisTextFill = isDark ? "#737373" : "#64748b"
  const crosshairStroke = isDark ? "#ffffff" : "#0f172a"
  const rpsStopOpacity = isDark ? 0.28 : 0.16
  const latencyStopOpacity = isDark ? 0.28 : 0.16
  const errorStopOpacity = isDark ? 0.28 : 0.16

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 backdrop-blur-md shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/80 dark:shadow-2xl transition-all">
      {/* Glow highlight */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-32 w-96 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-neutral-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          {/* <div className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
          </div> */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                Live Cluster Telemetry
              </h3>
              <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                1s PromQL Sync
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-500 font-mono mt-0.5">
              Aggregated across all active Kubernetes pods via Prometheus
            </p>
          </div>
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-neutral-800/80 dark:bg-neutral-900/60">
          {[30, 60, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => onWindowChange?.(sec)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-mono transition-all ${
                timeWindowSeconds === sec
                  ? "bg-white text-slate-900 dark:bg-white dark:text-black font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/50"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Synchronized Hover Inspection Bar */}
      <div className="mt-2.5 flex min-h-[28px] items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-1 text-[11px] font-mono dark:border-neutral-800/60 dark:bg-neutral-900/40">
        {hoveredPoint ? (
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-slate-700 dark:text-neutral-300">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-semibold">
              <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
              {hoveredPoint.iso_time}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-slate-500 dark:text-neutral-400">Throughput:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{hoveredPoint.rps} req/s</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              <span className="text-slate-500 dark:text-neutral-400">P95 Latency:</span>
              <strong className="text-cyan-600 dark:text-cyan-400 font-mono">
                {hoveredPoint.p95_latency_ms !== null && hoveredPoint.rps > 0 ? `${hoveredPoint.p95_latency_ms} ms` : "0 ms (idle)"}
              </strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span className="text-slate-500 dark:text-neutral-400">Error Rate:</span>
              <strong className={hoveredPoint.error_rate > 0 ? "text-rose-500 dark:text-rose-400" : "text-slate-600 dark:text-neutral-400"}>
                {hoveredPoint.error_rate}% ({hoveredPoint.error_count} fails)
              </strong>
            </span>
            <span className="hidden lg:inline text-slate-400 dark:text-neutral-500">
              Samples: {hoveredPoint.requests}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-500 text-[11px]">
            <Clock className="h-3 w-3 text-slate-400 dark:text-neutral-600" />
            <span>Hover over any chart to inspect synchronized multi-pod observations</span>
          </div>
        )}

        {activeExperiment && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Load burst in progress
          </span>
        )}
      </div>

      {/* Empty State Banner if no traffic in window */}
      {!hasData && !isLoading && (
        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-2.5 px-4 text-center dark:border-neutral-800 dark:bg-neutral-900/20">
          <p className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
            Cluster is idle. Start an experiment below to observe live throughput curves, latency percentiles, and pod metrics.
          </p>
        </div>
      )}

      {/* 3 Charts Grid */}
      <div className="mt-3 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {/* 1. Throughput Chart */}
        <div className="relative rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4 transition-colors hover:border-slate-300 dark:border-neutral-800/80 dark:bg-neutral-900/30 dark:hover:border-neutral-700/80">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-neutral-200">
              <Zap className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              Throughput (RPS)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">0 – {maxRps} req/s</span>
          </div>

          <div
            className="relative mt-2 cursor-crosshair select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = e.clientX - rect.left - padding.left
              const pct = Math.max(0, Math.min(1, relX / chartW))
              setHoverIndex(Math.round(pct * (points.length - 1)))
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="rpsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={rpsStopOpacity} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left + chartW}
                y2={padding.top}
                stroke={gridStroke}
                strokeDasharray="2 3"
              />
              <line
                x1={padding.left}
                y1={padding.top + chartH / 2}
                x2={padding.left + chartW}
                y2={padding.top + chartH / 2}
                stroke={gridStroke}
                strokeDasharray="2 3"
              />
              <line
                x1={padding.left}
                y1={bottomY}
                x2={padding.left + chartW}
                y2={bottomY}
                stroke={baselineStroke}
              />

              {/* Y Axis text */}
              <text x={padding.left - 6} y={padding.top + 4} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                {maxRps}
              </text>
              <text x={padding.left - 6} y={padding.top + chartH / 2 + 3} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                {Math.round(maxRps / 2)}
              </text>
              <text x={padding.left - 6} y={bottomY + 1} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                0
              </text>

              {/* Area fill */}
              {rpsArea && <path d={rpsArea} fill="url(#rpsAreaGradient)" />}

              {/* Smooth curve line */}
              {rpsCurve && (
                <path
                  d={rpsCurve}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Event markers */}
              {eventMarkers.map((em, i) => (
                <line
                  key={i}
                  x1={getX(em.index)}
                  y1={padding.top}
                  x2={getX(em.index)}
                  y2={bottomY}
                  stroke={em.color}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Synchronized Crosshair */}
              {hoverIndex !== null && (
                <>
                  <line
                    x1={getX(hoverIndex)}
                    y1={padding.top}
                    x2={getX(hoverIndex)}
                    y2={bottomY}
                    stroke={crosshairStroke}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                  {hoveredRpsCoord && (
                    <circle
                      cx={hoveredRpsCoord.x}
                      cy={hoveredRpsCoord.y}
                      r="4"
                      fill="#10b981"
                      stroke={crosshairStroke}
                      strokeWidth="1.5"
                    />
                  )}
                </>
              )}

              {/* X Axis Time Labels */}
              {points.length > 0 && (
                <>
                  <text x={padding.left} y={height - 5} fill={axisTextFill} fontSize="8" fontFamily="monospace">
                    {points[0].iso_time}
                  </text>
                  <text x={padding.left + chartW} y={height - 5} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                    {points[points.length - 1].iso_time}
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>

        {/* 2. P95 Latency Chart */}
        <div className="relative rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4 transition-colors hover:border-slate-300 dark:border-neutral-800/80 dark:bg-neutral-900/30 dark:hover:border-neutral-700/80">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-neutral-200">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              P95 Latency (ms)
            </span>
            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
              SLO ≤ 50ms
            </span>
          </div>

          <div
            className="relative mt-2 cursor-crosshair select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = e.clientX - rect.left - padding.left
              const pct = Math.max(0, Math.min(1, relX / chartW))
              setHoverIndex(Math.round(pct * (points.length - 1)))
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="latencyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={latencyStopOpacity} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left + chartW}
                y2={padding.top}
                stroke={gridStroke}
                strokeDasharray="2 3"
              />
              <line
                x1={padding.left}
                y1={padding.top + chartH / 2}
                x2={padding.left + chartW}
                y2={padding.top + chartH / 2}
                stroke={gridStroke}
                strokeDasharray="2 3"
              />

              {/* SLO Reference Threshold Line (50ms) - Clean dashed line without text collision */}
              {50 <= maxLatency && (
                <line
                  x1={padding.left}
                  y1={padding.top + chartH - (50 / maxLatency) * chartH}
                  x2={padding.left + chartW}
                  y2={padding.top + chartH - (50 / maxLatency) * chartH}
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
              )}

              <line
                x1={padding.left}
                y1={bottomY}
                x2={padding.left + chartW}
                y2={bottomY}
                stroke={baselineStroke}
              />

              {/* Y Axis text */}
              <text x={padding.left - 6} y={padding.top + 4} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                {maxLatency}
              </text>
              <text x={padding.left - 6} y={padding.top + chartH / 2 + 3} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                {Math.round(maxLatency / 2)}
              </text>
              <text x={padding.left - 6} y={bottomY + 1} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                0
              </text>

              {/* Area fill */}
              {latencyArea && <path d={latencyArea} fill="url(#latencyAreaGradient)" />}

              {/* Smooth curve line */}
              {latencyCurve && (
                <path
                  d={latencyCurve}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Event markers */}
              {eventMarkers.map((em, i) => (
                <line
                  key={i}
                  x1={getX(em.index)}
                  y1={padding.top}
                  x2={getX(em.index)}
                  y2={bottomY}
                  stroke={em.color}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Synchronized Crosshair */}
              {hoverIndex !== null && (
                <>
                  <line
                    x1={getX(hoverIndex)}
                    y1={padding.top}
                    x2={getX(hoverIndex)}
                    y2={bottomY}
                    stroke={crosshairStroke}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                  {hoveredLatencyCoord && (
                    <circle
                      cx={hoveredLatencyCoord.x}
                      cy={hoveredLatencyCoord.y}
                      r="4"
                      fill="#06b6d4"
                      stroke={crosshairStroke}
                      strokeWidth="1.5"
                    />
                  )}
                </>
              )}

              {/* X Axis Time Labels */}
              {points.length > 0 && (
                <>
                  <text x={padding.left} y={height - 5} fill={axisTextFill} fontSize="8" fontFamily="monospace">
                    {points[0].iso_time}
                  </text>
                  <text x={padding.left + chartW} y={height - 5} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                    {points[points.length - 1].iso_time}
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>

        {/* 3. Error Rate Chart */}
        <div className="relative rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4 transition-colors hover:border-slate-300 dark:border-neutral-800/80 dark:bg-neutral-900/30 dark:hover:border-neutral-700/80">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-neutral-200">
              <Activity className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
              Error Rate (%)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">0 – {maxErrorRate}%</span>
          </div>

          <div
            className="relative mt-2 cursor-crosshair select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = e.clientX - rect.left - padding.left
              const pct = Math.max(0, Math.min(1, relX / chartW))
              setHoverIndex(Math.round(pct * (points.length - 1)))
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="errorAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={errorStopOpacity} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left + chartW}
                y2={padding.top}
                stroke={gridStroke}
                strokeDasharray="2 3"
              />
              <line
                x1={padding.left}
                y1={bottomY}
                x2={padding.left + chartW}
                y2={bottomY}
                stroke={baselineStroke}
              />

              {/* Y Axis text */}
              <text x={padding.left - 6} y={padding.top + 4} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                {maxErrorRate}%
              </text>
              <text x={padding.left - 6} y={bottomY + 1} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                0%
              </text>

              {/* Area fill */}
              {errorArea && <path d={errorArea} fill="url(#errorAreaGradient)" />}

              {/* Smooth curve line */}
              {errorCurve && (
                <path
                  d={errorCurve}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Event markers */}
              {eventMarkers.map((em, i) => (
                <line
                  key={i}
                  x1={getX(em.index)}
                  y1={padding.top}
                  x2={getX(em.index)}
                  y2={bottomY}
                  stroke={em.color}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Synchronized Crosshair */}
              {hoverIndex !== null && (
                <>
                  <line
                    x1={getX(hoverIndex)}
                    y1={padding.top}
                    x2={getX(hoverIndex)}
                    y2={bottomY}
                    stroke={crosshairStroke}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                  {hoveredErrorCoord && (
                    <circle
                      cx={hoveredErrorCoord.x}
                      cy={hoveredErrorCoord.y}
                      r="4"
                      fill="#f43f5e"
                      stroke={crosshairStroke}
                      strokeWidth="1.5"
                    />
                  )}
                </>
              )}

              {/* X Axis Time Labels */}
              {points.length > 0 && (
                <>
                  <text x={padding.left} y={height - 5} fill={axisTextFill} fontSize="8" fontFamily="monospace">
                    {points[0].iso_time}
                  </text>
                  <text x={padding.left + chartW} y={height - 5} fill={axisTextFill} fontSize="8" fontFamily="monospace" textAnchor="end">
                    {points[points.length - 1].iso_time}
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
