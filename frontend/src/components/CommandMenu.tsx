import React, { useEffect, useState } from "react"
import {
  Activity,
  Copy,
  Flame,
  Search,
  Square,
  Terminal,
  Zap,
} from "lucide-react"

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onStartExperiment: (intensity: "low" | "moderate" | "high") => void
  onStopExperiment: () => void
  isExperimentRunning: boolean
  onToggleLogs: () => void
  isLogsOpen: boolean
  onPingTarget: () => void
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onStartExperiment,
  onStopExperiment,
  isExperimentRunning,
  onToggleLogs,
  isLogsOpen,
  onPingTarget,
}) => {
  const [query, setQuery] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (isOpen) onClose()
        else setQuery("")
      }
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopyMetricsCurl = () => {
    navigator.clipboard.writeText("curl -s http://localhost:8000/api/v1/metrics | jq .")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const q = query.toLowerCase().trim()

  const matches = (text: string) => !q || text.toLowerCase().includes(q)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-neutral-850 px-3.5 py-2.5">
          <Search className="h-4 w-4 text-slate-400 dark:text-neutral-500 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or filter actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-sans dark:text-white dark:placeholder-neutral-500"
          />
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Command Groups */}
        <div className="max-h-72 overflow-y-auto p-2 text-xs">
          {/* Section 1: Experiments */}
          {(matches("traffic burst") || matches("experiment") || matches("start") || matches("stop")) && (
            <div className="mb-2">
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-medium">
                Reliability Experiments
              </span>
              <div className="mt-1 space-y-0.5">
                {!isExperimentRunning ? (
                  <>
                    {matches("low 10 rps") && (
                      <button
                        onClick={() => {
                          onStartExperiment("low")
                          onClose()
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Start Traffic Burst (Low — 10 RPS, 10s)</span>
                        </div>
                        <kbd className="font-mono text-[10px] text-slate-400 dark:text-neutral-500">10 RPS</kbd>
                      </button>
                    )}

                    {matches("moderate 25 rps") && (
                      <button
                        onClick={() => {
                          onStartExperiment("moderate")
                          onClose()
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>Start Traffic Burst (Moderate — 25 RPS, 15s)</span>
                        </div>
                        <kbd className="font-mono text-[10px] text-slate-400 dark:text-neutral-500">25 RPS</kbd>
                      </button>
                    )}

                    {matches("high 50 rps") && (
                      <button
                        onClick={() => {
                          onStartExperiment("high")
                          onClose()
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Start Traffic Burst (High — 50 RPS, 20s)</span>
                        </div>
                        <kbd className="font-mono text-[10px] text-slate-400 dark:text-neutral-500">50 RPS</kbd>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onStopExperiment()
                      onClose()
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Square className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 fill-current" />
                      <span>Stop Active Experiment Immediately</span>
                    </div>
                    <kbd className="font-mono text-[10px] text-rose-600 dark:text-rose-400">CANCEL</kbd>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Observability */}
          {(matches("probe") || matches("logs") || matches("terminal") || matches("curl") || matches("metrics")) && (
            <div>
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-medium">
                Observability & Tools
              </span>
              <div className="mt-1 space-y-0.5">
                {matches("probe test endpoint") && (
                  <button
                    onClick={() => {
                      onPingTarget()
                      onClose()
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Activity className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
                      <span>Probe Test Endpoint (/api/v1/test-target)</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 dark:text-neutral-500">ping</span>
                  </button>
                )}

                {matches("telemetry terminal logs") && (
                  <button
                    onClick={() => {
                      onToggleLogs()
                      onClose()
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Terminal className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
                      <span>{isLogsOpen ? "Hide Live Telemetry Terminal" : "Show Live Telemetry Terminal"}</span>
                    </div>
                    <kbd className="font-mono text-[10px] text-slate-400 dark:text-neutral-500">L</kbd>
                  </button>
                )}

                {matches("curl metrics") && (
                  <button
                    onClick={handleCopyMetricsCurl}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
                      <span>{copied ? "Copied metrics cURL!" : "Copy cURL for /api/v1/metrics"}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 dark:text-neutral-500">curl</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3.5 py-2 text-[10px] font-mono text-slate-400 dark:border-neutral-850 dark:bg-black/40 dark:text-neutral-500">
          <div className="flex items-center gap-2.5">
            <span><kbd className="rounded border border-slate-200 bg-white px-1 py-0.2 dark:border-neutral-800 dark:bg-neutral-900">↑↓</kbd> navigate</span>
            <span><kbd className="rounded border border-slate-200 bg-white px-1 py-0.2 dark:border-neutral-800 dark:bg-neutral-900">↵</kbd> select</span>
          </div>
          <span><kbd className="rounded border border-slate-200 bg-white px-1 py-0.2 dark:border-neutral-800 dark:bg-neutral-900">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
