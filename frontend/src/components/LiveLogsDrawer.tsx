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
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 animate-in slide-in-from-top-2 duration-150 transition-all">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-850 pb-2.5 font-mono text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
          <Terminal className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
          <span className="font-semibold text-slate-900 dark:text-white">Live Telemetry Stream</span>
          <span className="text-slate-300 dark:text-neutral-700">|</span>
          <span className="text-[11px] text-slate-500 dark:text-neutral-500">otel.exporter=stdout • traces & spans</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Log Output Console */}
      <div className="mt-2 max-h-56 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-700 dark:text-neutral-300 pr-1">
        {logs.length === 0 ? (
          <div className="py-4 text-center text-slate-400 dark:text-neutral-600">
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
