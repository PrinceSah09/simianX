import React, { useEffect, useState } from "react"
import { Search, X, Zap, Radio, Terminal, Copy, Check, StopCircle, Bell } from "lucide-react"

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onStartExperiment: (intensity: "low" | "moderate" | "high") => void
  onStopExperiment: () => void
  isExperimentRunning: boolean
  onOpenLogs?: () => void
  onPingTarget: () => void
  onOpenSlackAlerts?: () => void
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onStartExperiment,
  onStopExperiment,
  isExperimentRunning,
  onOpenLogs,
  onPingTarget,
  onOpenSlackAlerts,
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

  const itemClass =
    "group flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-[14.5px] tracking-[-0.01em] text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7] active:scale-[0.99]"

  const hasExperimentMatches =
    matches("traffic burst") || matches("experiment") || matches("start") || matches("stop") || matches("gentle") || matches("nominal") || matches("maximum")

  const hasToolMatches =
    matches("probe") || matches("logs") || matches("terminal") || matches("curl") || matches("metrics") || matches("slack") || matches("alert") || matches("webhook")

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-4 pt-16 sm:pt-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[660px] overflow-hidden rounded-[26px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.25)] border border-black/[0.06] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-4">
          <Search className="h-4 w-4 text-[#86868b] shrink-0" />
          <input
            type="text"
            placeholder="Search commands, scenarios, or tools…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-[16px] sm:text-[17px] tracking-[-0.015em] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.05] hover:text-[#1d1d1f]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Fixed Height Items List (No Scroll, All Important Items Visible) */}
        <div className="p-3 sm:p-4 space-y-3">
          {hasExperimentMatches && (
            <div>
              <p className="px-3 pb-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Simulation Scenarios
              </p>
              {!isExperimentRunning ? (
                <div className="space-y-0.5">
                  {(matches("gentle") || matches("low") || matches("10")) && (
                    <button
                      className={itemClass}
                      onClick={() => {
                        onStartExperiment("low")
                        onClose()
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-[#0071e3]" />
                        <span>Traffic burst, gentle</span>
                      </div>
                      <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11.5px] font-medium text-[#6e6e73]">
                        10 RPS · 30s
                      </span>
                    </button>
                  )}
                  {(matches("nominal") || matches("moderate") || matches("25")) && (
                    <button
                      className={itemClass}
                      onClick={() => {
                        onStartExperiment("moderate")
                        onClose()
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-[#ff9500]" />
                        <span>Traffic burst, nominal</span>
                      </div>
                      <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11.5px] font-medium text-[#6e6e73]">
                        25 RPS · 30s
                      </span>
                    </button>
                  )}
                  {(matches("maximum") || matches("high") || matches("50")) && (
                    <button
                      className={itemClass}
                      onClick={() => {
                        onStartExperiment("high")
                        onClose()
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-[#ff3b30]" />
                        <span>Traffic burst, maximum</span>
                      </div>
                      <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11.5px] font-medium text-[#6e6e73]">
                        50 RPS · 30s
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  className={`${itemClass} bg-[#ff3b30]/10 text-[#dc2626] hover:bg-[#ff3b30]/20`}
                  onClick={() => {
                    onStopExperiment()
                    onClose()
                  }}
                >
                  <div className="flex items-center gap-3">
                    <StopCircle className="h-4 w-4 text-[#dc2626]" />
                    <span className="font-medium">Stop active chaos simulation</span>
                  </div>
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#dc2626]">
                    Halt
                  </span>
                </button>
              )}
            </div>
          )}

          {hasToolMatches && (
            <div>
              <p className="px-3 pb-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Observability Tools
              </p>
              <div className="space-y-0.5">
                {matches("probe") && (
                  <button
                    className={itemClass}
                    onClick={() => {
                      onPingTarget()
                      onClose()
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Radio className="h-4 w-4 text-[#34c759]" />
                      <span>Probe backend test target</span>
                    </div>
                    <span className="text-[12px] font-mono text-[#86868b]">GET /workload</span>
                  </button>
                )}
                {matches("logs") && onOpenLogs && (
                  <button
                    className={itemClass}
                    onClick={() => {
                      onOpenLogs()
                      onClose()
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Terminal className="h-4 w-4 text-[#86868b]" />
                      <span>Open live request logs console</span>
                    </div>
                    <span className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[10.5px] text-[#6e6e73]">
                      L
                    </span>
                  </button>
                )}
                {matches("curl") && (
                  <button className={itemClass} onClick={handleCopyMetricsCurl}>
                    <div className="flex items-center gap-3">
                      <Copy className="h-4 w-4 text-[#86868b]" />
                      <span>{copied ? "Copied metrics cURL command!" : "Copy Prometheus metrics cURL"}</span>
                    </div>
                    {copied ? (
                      <Check className="h-4 w-4 text-[#34c759]" />
                    ) : (
                      <span className="text-[12px] font-mono text-[#86868b]">/metrics</span>
                    )}
                  </button>
                )}
                {(matches("slack") || matches("alert") || matches("webhook") || matches("notify")) && onOpenSlackAlerts && (
                  <button
                    className={itemClass}
                    onClick={() => {
                      onOpenSlackAlerts()
                      onClose()
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-[#e01e5a]" />
                      <span>Configure Slack alerts & webhook</span>
                    </div>
                    <span className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[10.5px] text-[#6e6e73]">
                      Slack
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {!hasExperimentMatches && !hasToolMatches && (
            <div className="py-8 text-center">
              <p className="text-[14px] text-[#86868b]">No matching commands found</p>
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between border-t border-black/[0.06] bg-[#fbfbfd] px-5 py-3 text-[11.5px] text-[#86868b]">
          <div className="flex items-center gap-3">
            <span><kbd className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[10.5px]">ESC</kbd> Close</span>
            <span><kbd className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[10.5px]">⌘K</kbd> Toggle</span>
          </div>
          <span className="hidden sm:inline font-medium text-[#1d1d1f]/60">SimianX Command Palette</span>
        </div>
      </div>
    </div>
  )
}

export default CommandMenu
