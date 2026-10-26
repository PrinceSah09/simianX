import React from "react"
import { useTheme } from "../context/ThemeContext"

interface SpeedometerGaugeProps {
  label: string
  value: number | null
  unit: string
  min?: number
  max: number
  threshold?: number
  thresholdLabel?: string
  status?: "healthy" | "degraded" | "unhealthy" | "idle"
  subtext?: string
  measurementWindow?: string
  emptyLabel?: string
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  label,
  value,
  unit,
  min = 0,
  max,
  threshold,
  thresholdLabel,
  status = "healthy",
  subtext,
  measurementWindow,
  emptyLabel = "—",
}) => {
  const { isDark } = useTheme()
  const safeId = label.toLowerCase().replace(/[^a-z0-9]/g, "-")

  // Center & Geometry: 240-degree wide sweep (from 150° bottom-left to 390° = 30° bottom-right)
  const cx = 110
  const cy = 112
  const r = 78
  const startAngle = 150
  const totalSweep = 240
  const arcLength = (totalSweep / 360) * 2 * Math.PI * r

  const isIdle = value === null || (value === 0 && status === "idle")
  const numericValue = value ?? 0
  const clamped = Math.max(min, Math.min(max, numericValue))
  const percent = max > min ? (clamped - min) / (max - min) : 0
  const strokeOffset = arcLength * (1 - percent)

  // Needle angle (Always visible! When idle or 0, sits cleanly at startAngle 150°)
  const needleAngleDeg = startAngle + percent * totalSweep

  // Needle geometry relative to (0,0) — rotated via translate+rotate so pivot is always the hub center
  const needleLength = r - 4
  const tailLength = 14
  const baseWidth = 3.5

  // Relative to pivot (0,0): tip points right (+X), tail points left (-X)
  const nTipX = needleLength
  const nTipY = 0
  const nTailX = -tailLength
  const nTailY = 0
  const nBaseTopY = -baseWidth
  const nBaseBotY = baseWidth

  // Color palette based on status
  const getTheme = () => {
    if (status === "unhealthy") {
      return {
        primary: "#f43f5e",
        secondary: "#fb7185",
        glow: isDark ? "drop-shadow(0 0 10px rgba(244,63,94,0.5))" : "none",
        bgGlow: "rgba(244,63,94,0.06)",
        badgeBorder: "border-rose-500/20 bg-rose-500/10 text-rose-500 dark:text-rose-400",
      }
    }
    if (status === "degraded") {
      return {
        primary: "#f59e0b",
        secondary: "#fbbf24",
        glow: isDark ? "drop-shadow(0 0 10px rgba(245,158,11,0.5))" : "none",
        bgGlow: "rgba(245,158,11,0.06)",
        badgeBorder: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      }
    }
    if (isIdle) {
      return {
        primary: isDark ? "#3f3f46" : "#94a3b8",
        secondary: isDark ? "#52525b" : "#cbd5e1",
        glow: "none",
        bgGlow: isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
        badgeBorder: "border-slate-200 bg-slate-100 text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400",
      }
    }
    return {
      primary: "#10b981",
      secondary: "#34d399",
      glow: isDark ? "drop-shadow(0 0 10px rgba(16,185,129,0.45))" : "none",
      bgGlow: "rgba(16,185,129,0.05)",
      badgeBorder: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    }
  }

  const themeColors = getTheme()

  // 25 Tachometer-style precision graduation ticks
  const tickCount = 25
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const tPercent = i / (tickCount - 1)
    const tAngleRad = ((startAngle + tPercent * totalSweep) * Math.PI) / 180
    const isMajor = i % 6 === 0 // 0%, 25%, 50%, 75%, 100%
    const outerR = r + 13
    const innerR = isMajor ? r + 3 : r + 7

    return {
      x1: cx + innerR * Math.cos(tAngleRad),
      y1: cy + innerR * Math.sin(tAngleRad),
      x2: cx + outerR * Math.cos(tAngleRad),
      y2: cy + outerR * Math.sin(tAngleRad),
      isMajor,
      isPassed: percent >= tPercent && !isIdle,
    }
  })

  // Threshold marker coordinates
  let thresholdMarker = null
  if (threshold !== undefined && threshold <= max) {
    const tPercent = Math.max(0, Math.min(1, (threshold - min) / (max - min)))
    const tAngleRad = ((startAngle + tPercent * totalSweep) * Math.PI) / 180
    thresholdMarker = {
      x1: cx + (r - 2) * Math.cos(tAngleRad),
      y1: cy + (r - 2) * Math.sin(tAngleRad),
      x2: cx + (r + 14) * Math.cos(tAngleRad),
      y2: cy + (r + 14) * Math.sin(tAngleRad),
    }
  }

  // SVG Arc Path: 150° to 390°
  const startX = cx + r * Math.cos((startAngle * Math.PI) / 180)
  const startY = cy + r * Math.sin((startAngle * Math.PI) / 180)
  const endX = cx + r * Math.cos(((startAngle + totalSweep) * Math.PI) / 180)
  const endY = cy + r * Math.sin(((startAngle + totalSweep) * Math.PI) / 180)
  const arcPath = `M ${startX} ${startY} A ${r} ${r} 0 1 1 ${endX} ${endY}`

  // Outer bezel circle
  const outerR = r + 16
  const outerStartX = cx + outerR * Math.cos((startAngle * Math.PI) / 180)
  const outerStartY = cy + outerR * Math.sin((startAngle * Math.PI) / 180)
  const outerEndX = cx + outerR * Math.cos(((startAngle + totalSweep) * Math.PI) / 180)
  const outerEndY = cy + outerR * Math.sin(((startAngle + totalSweep) * Math.PI) / 180)
  const outerArcPath = `M ${outerStartX} ${outerStartY} A ${outerR} ${outerR} 0 1 1 ${outerEndX} ${outerEndY}`

  // Theme-aware SVG colors
  const bezelStroke = isDark ? "#1c1c20" : "#e2e8f0"
  const trackStroke = isDark ? "#141416" : "#f1f5f9"
  const readoutFill = isDark ? "#ffffff" : "#0f172a"
  const unitFill = isDark ? "#71717a" : "#64748b"
  const boundsFill = isDark ? "#52525b" : "#94a3b8"
  const hubOuter = isDark ? "#0d0d10" : "#ffffff"
  const hubOuterStroke = isDark ? "#27272a" : "#cbd5e1"
  const hubInner = isDark ? "#18181b" : "#f8fafc"
  const hubInnerStroke = isDark ? "#3f3f46" : "#94a3b8"

  return (
    <div className="relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 transition-all duration-300 hover:border-slate-300 dark:border-neutral-800/80 dark:bg-neutral-950/80 dark:hover:border-neutral-700/80 shadow-xs dark:shadow-md overflow-hidden">
      {/* Sleek Minimal Header: Label + Measurement Window */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-850/80 pb-2">
        <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
          {label}
        </span>
        {measurementWindow && (
          <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">
            {measurementWindow}
          </span>
        )}
      </div>

      {/* Speedometer Instrument Dial */}
      <div className="relative my-2 flex items-center justify-center">
        {/* Soft atmospheric gradient under the speedometer dial matching the needle color */}
        <div
          className="absolute -bottom-2 w-48 h-24 rounded-full blur-2xl pointer-events-none transition-all duration-500"
          style={{
            background: isIdle
              ? "transparent"
              : `radial-gradient(circle at 50% 60%, ${themeColors.primary}33 0%, ${themeColors.primary}10 50%, transparent 75%)`,
          }}
        />

        <svg
          viewBox="0 0 240 172"
          className="w-full max-w-[240px] overflow-visible select-none relative z-10"
        >
          <defs>
            {/* Rich radial dial back-plate gradient matching needle color */}
            <radialGradient id={`dialPlate-${safeId}`} cx="50%" cy="65%" r="65%">
              <stop
                offset="0%"
                stopColor={themeColors.primary}
                stopOpacity={isIdle ? "0.03" : isDark ? "0.24" : "0.15"}
              />
              <stop
                offset="55%"
                stopColor={themeColors.primary}
                stopOpacity={isIdle ? "0.01" : isDark ? "0.08" : "0.04"}
              />
              <stop
                offset="100%"
                stopColor={themeColors.primary}
                stopOpacity="0"
              />
            </radialGradient>

            {/* Glowing sweep gradient */}
            <linearGradient id={`sweepGrad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="70%" stopColor={themeColors.primary} />
              <stop offset="100%" stopColor={themeColors.secondary} />
            </linearGradient>

            {/* Clip path so dial plate never bleeds below dial sweep into footer */}
            <clipPath id={`dialClip-${safeId}`}>
              <rect x="0" y="0" width="240" height="152" rx="6" />
            </clipPath>
          </defs>

          {/* Dial Backplate (clipped safely above footer) with needle color gradient */}
          <circle
            cx={cx}
            cy={cy}
            r={r + 14}
            clipPath={`url(#dialClip-${safeId})`}
            fill={`url(#dialPlate-${safeId})`}
            stroke={isDark ? "transparent" : "#f1f5f9"}
            strokeWidth="1"
          />

          {/* Outer Bezel Guide */}
          <path
            d={outerArcPath}
            fill="none"
            stroke={bezelStroke}
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Recessed Base Track */}
          <path
            d={arcPath}
            fill="none"
            stroke={trackStroke}
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Precision Graduation Ticks */}
          {ticks.map((tick, i) => {
            const unpassedStroke = tick.isMajor
              ? (isDark ? "#3f3f46" : "#94a3b8")
              : (isDark ? "#222226" : "#cbd5e1")
            return (
              <line
                key={i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={tick.isPassed ? themeColors.primary : unpassedStroke}
                strokeWidth={tick.isMajor ? "1.75" : "1"}
                strokeLinecap="round"
                className="transition-colors duration-300"
              />
            )
          })}

          {/* Active Value Arc */}
          <path
            d={arcPath}
            fill="none"
            stroke={`url(#sweepGrad-${safeId})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={isIdle ? arcLength : strokeOffset}
            style={{
              transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              filter: themeColors.glow,
            }}
          />

          {/* Threshold SLO Marker (if configured) */}
          {thresholdMarker && (
            <line
              x1={thresholdMarker.x1}
              y1={thresholdMarker.y1}
              x2={thresholdMarker.x2}
              y2={thresholdMarker.y2}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.85"
            />
          )}

          {/* Tapered Cockpit Needle — translate to hub center, then rotate around (0,0) */}
          {/* This fixes the CSS transform-origin viewport-relative bug in SVG */}
          <g transform={`translate(${cx} ${cy})`}>
            <g
              style={{
                transform: `rotate(${needleAngleDeg}deg)`,
                transformOrigin: "0px 0px",
                transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Tapered needle blade polygon */}
              <polygon
                points={`${nTipX},${nTipY} 0,${nBaseTopY} ${nTailX},${nTailY} 0,${nBaseBotY}`}
                fill={isIdle ? (isDark ? "#2d2d32" : "#94a3b8") : (isDark ? "#ffffff" : "#0f172a")}
                stroke={isIdle ? (isDark ? "#3f3f46" : "#cbd5e1") : themeColors.primary}
                strokeWidth="0.75"
                style={{
                  filter: isIdle ? "none" : themeColors.glow,
                  transition: "fill 0.4s ease, stroke 0.4s ease",
                }}
              />

              {/* Glowing needle center line */}
              <line
                x1={0}
                y1={0}
                x2={nTipX}
                y2={nTipY}
                stroke={isIdle ? (isDark ? "#52525b" : "#cbd5e1") : themeColors.secondary}
                strokeWidth="1.25"
                strokeLinecap="round"
              />

              {/* Glowing tip bead */}
              <circle
                cx={nTipX}
                cy={nTipY}
                r="2"
                fill={isIdle ? (isDark ? "#52525b" : "#94a3b8") : themeColors.secondary}
              />
            </g>
          </g>

          {/* Multi-layered Center Hub */}
          <circle cx={cx} cy={cy} r={14} fill={hubOuter} stroke={hubOuterStroke} strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={9} fill={hubInner} stroke={hubInnerStroke} strokeWidth="1" />
          <circle
            cx={cx}
            cy={cy}
            r="4"
            fill={isIdle ? (isDark ? "#3f3f46" : "#94a3b8") : themeColors.primary}
            style={{ transition: "fill 0.4s ease" }}
          />
          <circle cx={cx - 1.2} cy={cy - 1.2} r="1.2" fill={isDark ? "#ffffff" : "#cbd5e1"} opacity="0.7" />

          {/* Scale Min & Max Endpoints */}
          <text
            x="32"
            y="156"
            fill={boundsFill}
            fontSize="10"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="500"
            textAnchor="middle"
          >
            {min}
          </text>
          <text
            x="208"
            y="156"
            fill={boundsFill}
            fontSize="10"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="500"
            textAnchor="middle"
          >
            {max}
          </text>

          {/* Central Numeric Readout */}
          <text
            x={cx}
            y={cy - 24}
            fill={readoutFill}
            fontSize="26"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="700"
            textAnchor="middle"
            letterSpacing="-0.03em"
          >
            {isIdle ? emptyLabel : numericValue.toFixed(numericValue >= 100 ? 0 : 1)}
          </text>

          {/* Unit Sub-Label */}
          <text
            x={cx}
            y={cy - 10}
            fill={unitFill}
            fontSize="9"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="600"
            letterSpacing="0.04em"
            textAnchor="middle"
          >
            {unit.toUpperCase()}
          </text>
        </svg>
      </div>

      {/* Footer Status & Context Meta */}
      <div className="relative z-20 flex items-center justify-between border-t border-slate-100 dark:border-neutral-850/80 pt-2 text-[11px] bg-white dark:bg-neutral-950">
        <span className="text-slate-500 dark:text-neutral-400 truncate max-w-[140px]">
          {subtext ?? (isIdle ? "0 req/s • Idle" : "Active")}
        </span>
        {thresholdLabel ? (
          <span
            className={`font-medium ${
              status === "unhealthy"
                ? "text-rose-600 dark:text-rose-400"
                : status === "degraded"
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-400 dark:text-neutral-500"
            }`}
          >
            {thresholdLabel}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-neutral-500 font-medium">
            {isIdle ? "Idle" : "Optimal"}
          </span>
        )}
      </div>
    </div>
  )
}
