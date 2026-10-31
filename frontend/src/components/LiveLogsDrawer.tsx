import React, { useEffect, useRef } from "react"
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
    <div className="mb-3 rounded-[28px] bg-white px-6 py-5 sm:px-8">
      <div className="flex items-center justify-between pb-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">Console</p>
          <h3 className="text-[21px] font-semibold tracking-[-0.03em]">Live activity</h3>
        </div>
        <div className="flex items-center gap-4 text-[15px]">
          <button onClick={onClearLogs} className="text-[#0066cc] hover:underline">
            Clear
          </button>
          <button onClick={onClose} className="text-[#6e6e73] hover:text-[#1d1d1f]">
            Close
          </button>
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto rounded-2xl bg-[#f5f5f7] px-4 py-3 font-mono text-[12px] leading-relaxed text-[#1d1d1f]">
        {logs.length === 0 ? (
          <p className="py-6 text-center font-sans text-[15px] text-[#6e6e73]">
            Waiting for a probe or an experiment.
          </p>
        ) : (
          logs.map((log) => (
            <p key={log.id} className="py-0.5">
              <span className="text-[#86868b]">{log.timestamp}</span>{" "}
              <span className={log.level === "ERROR" ? "text-[#ff3b30]" : log.level === "WARN" ? "text-[#b25000]" : "text-[#1d1d1f]"}>
                {log.level}
              </span>{" "}
              <span className="text-[#6e6e73]">{log.endpoint}</span>{" "}
              {log.message}
            </p>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
