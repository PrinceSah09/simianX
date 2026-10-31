import React from "react"
import { motion } from "framer-motion"

interface AppleRingGaugeProps {
  label: string
  value: number | null
  unit: string
  max: number
  color: "cyan" | "purple" | "emerald" | "rose" | "amber"
  status?: "healthy" | "degraded" | "unhealthy" | "idle"
  subtitle?: string
  metaValues?: { label: string; value: string }[]
}

const COLOR_MAP = {
  cyan: {
    gradient: ["#00F0FF", "#0072FF"],
    glow: "rgba(0, 240, 255, 0.35)",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/10",
  },
  purple: {
    gradient: ["#D946EF", "#8B5CF6"],
    glow: "rgba(217, 70, 239, 0.35)",
    text: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/10",
  },
  emerald: {
    gradient: ["#10B981", "#059669"],
    glow: "rgba(16, 185, 129, 0.35)",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
  },
  rose: {
    gradient: ["#F43F5E", "#E11D48"],
    glow: "rgba(244, 63, 94, 0.35)",
    text: "text-rose-400",
    border: "border-rose-500/20",
    bg: "bg-rose-500/10",
  },
  amber: {
    gradient: ["#F59E0B", "#D97706"],
    glow: "rgba(245, 158, 11, 0.35)",
    text: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
  },
}

export const AppleRingGauge: React.FC<AppleRingGaugeProps> = ({
  label,
  value,
  unit,
  max,
  color,
  status = "healthy",
  subtitle,
  metaValues,
}) => {
  const theme = COLOR_MAP[color]
  const numVal = value ?? 0
  const clamped = Math.max(0, Math.min(max, numVal))
  const percent = max > 0 ? clamped / max : 0

  // SVG Ring geometry
  const size = 118
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - percent * circumference

  const gradientId = `ring-grad-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-zinc-950/70 p-4 border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all duration-300 hover:border-white/[0.16] hover:bg-zinc-900/60">
      {/* Specular Top Edge Light Refraction */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {/* Subtle Corner Glow */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: theme.gradient[0] }}
      />

      {/* Card Header: Category + Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 font-sans">
          {label}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${
            status === "unhealthy"
              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
              : status === "degraded"
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "unhealthy"
                ? "bg-rose-400"
                : status === "degraded"
                ? "bg-amber-400"
                : "bg-emerald-400"
            }`}
          />
          {status}
        </span>
      </div>

      {/* Gauge & Value Section */}
      <div className="flex items-center justify-between gap-3 my-1">
        {/* Metric Figure */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
              {value !== null ? (Number.isInteger(numVal) ? numVal : numVal.toFixed(1)) : "—"}
            </span>
            <span className="text-xs font-mono text-zinc-400 font-medium">
              {unit}
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-zinc-400 font-sans">
              {subtitle}
            </p>
          )}
        </div>

        {/* Minimalist Apple Circular Activity Ring */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width={size} height={size} className="-rotate-90">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={theme.gradient[0]} />
                <stop offset="100%" stopColor={theme.gradient[1]} />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Active Progress Arc */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                strokeDasharray: circumference,
                filter: `drop-shadow(0 0 6px ${theme.glow})`,
              }}
            />
          </svg>

          {/* Centered Percentage indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-mono font-semibold text-zinc-300">
              {Math.round(percent * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Meta Values Row */}
      {metaValues && metaValues.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-400">
          {metaValues.map((m, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <span className="text-zinc-500">{m.label}:</span>
              <span className="text-zinc-300 font-medium">{m.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
