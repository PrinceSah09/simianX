import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import type { LogEntry } from "../types/telemetry"

interface LiveLogsDrawerProps {
  isOpen: boolean
  onClose: () => void
  logs: LogEntry[]
  onClearLogs: () => void
}

export const LiveLogsDrawer: React.FC<LiveLogsDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<"all" | "errors" | "slow">("all")

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, isOpen])

  const filteredLogs = logs.filter((log) => {
    if (filter === "errors") return log.status >= 400
    if (filter === "slow") return log.durationMs >= 50
    return true
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
          {/* Subtle click-outside backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
          />

          {/* Slide-Up Bottom Terminal Drawer (macOS Terminal Aesthetic) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto relative z-50 mx-auto flex h-[380px] w-full max-w-[980px] flex-col rounded-t-[24px] border-t border-x border-white/10 bg-[#1c1c1e] text-white shadow-[0_-24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            {/* Header: Clean, Uncluttered macOS Bar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-3">
              {/* Left: Title & Count */}
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white/90 tracking-tight">
                  Console
                </span>
                <span className="text-[12px] text-white/30">·</span>
                <span className="font-mono text-[12px] tabular-nums text-white/45">
                  {logs.length} calls
                </span>
              </div>

              {/* Center: Apple Sliding Filter Segment */}
              <div className="flex items-center rounded-full bg-white/[0.06] p-0.5 text-[11px]">
                {(
                  [
                    ["all", "All"],
                    ["errors", "Errors"],
                    ["slow", "Slow (>50ms)"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded-full px-3 py-0.5 font-medium transition-colors ${
                      filter === key
                        ? "bg-white/15 text-white"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="text-[12px] text-white/50 hover:text-white transition-colors"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  title="Close (L or Esc)"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal Body: Clean Monospace Stream */}
            <div className="flex-1 overflow-y-auto px-6 py-3 font-mono text-[12px] select-text">
              {filteredLogs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-white/35">
                  <p className="text-[13px] font-sans">
                    {logs.length === 0
                      ? "Waiting for experiment calls…"
                      : "No requests match the selected filter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredLogs.map((log) => {
                    const isError = log.status >= 400
                    const isSlow = log.durationMs >= 50
                    const statusColor =
                      log.status >= 500
                        ? "text-[#ff453a]"
                        : log.status >= 400
                        ? "text-[#ff9f0a]"
                        : "text-[#30d158]"

                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 py-0.5 px-2 rounded hover:bg-white/[0.04] transition-colors leading-tight"
                      >
                        {/* Time */}
                        <span className="w-20 shrink-0 text-[11px] tabular-nums text-white/35">
                          {log.timestamp}
                        </span>

                        {/* Status Code (Clean colored text, not a chunky pill) */}
                        <span
                          className={`w-7 shrink-0 text-right font-medium tabular-nums ${statusColor}`}
                        >
                          {log.status || 200}
                        </span>

                        {/* Method */}
                        <span className="shrink-0 text-[10.5px] uppercase text-white/30">
                          GET
                        </span>

                        {/* Endpoint */}
                        <span className="shrink-0 text-white/80">
                          {log.endpoint || "/api/v1/test-target"}
                        </span>

                        {/* Duration */}
                        <span
                          className={`shrink-0 tabular-nums text-[11.5px] ${
                            isSlow ? "font-medium text-[#ff9f0a]" : "text-white/40"
                          }`}
                        >
                          {log.durationMs}ms
                        </span>

                        {/* Context note (only when error or chaos injected) */}
                        {log.message && (
                          <span
                            className={`truncate text-[11px] ${
                              isError ? "text-[#ff453a]/90 font-medium" : "text-white/35"
                            }`}
                          >
                            — {log.message}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
