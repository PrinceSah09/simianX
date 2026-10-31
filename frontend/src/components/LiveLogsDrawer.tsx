import React, { useEffect, useRef } from "react"
import { Terminal, Trash2, X } from "lucide-react"
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

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, isOpen])

  if (!isOpen) return null

  return (
    <div className="mb-6 rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-top-2 duration-150 transition-all">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <Terminal className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-semibold text-white">Live Telemetry Console</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[11px] text-zinc-400">OpenTelemetry stdout logs & spans</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Log Output Console */}
      <div className="mt-2 max-h-56 overflow-y-auto space-y-1 font-mono text-[11px] text-zinc-300 pr-1">
        {logs.length === 0 ? (
          <div className="py-4 text-center text-zinc-500">
            Waiting for requests... Click 'Probe Target' or run an experiment to see live span traces.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 rounded px-2 py-1 hover:bg-slate-50 dark:hover:bg-neutral-900/60"
            >
              <span className="text-slate-400 dark:text-neutral-500 shrink-0">{log.timestamp}</span>
              <span
                className={`font-semibold shrink-0 ${
                  log.level === "ERROR"
                    ? "text-rose-600 dark:text-rose-400"
                    : log.level === "WARN"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                [{log.level}]
              </span>
              <span className="text-slate-600 dark:text-neutral-400 shrink-0">{log.endpoint}</span>
              {log.status && (
                <span className="text-cyan-600 dark:text-cyan-400 shrink-0 font-medium">({log.status})</span>
              )}
              {log.durationMs && (
                <span className="text-slate-400 dark:text-neutral-500 shrink-0">{log.durationMs}ms</span>
              )}
              <span className="text-slate-800 dark:text-neutral-300 truncate">{log.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
