import React, { useEffect, useState } from "react"

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

  const itemClass =
    "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[17px] tracking-[-0.01em] text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]"

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-md sm:pt-32"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] overflow-hidden rounded-[22px] bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-black/[0.08] px-5 py-4">
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-[19px] tracking-[-0.02em] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {(matches("traffic burst") || matches("experiment") || matches("start") || matches("stop")) && (
            <div className="mb-2">
              <p className="px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Experiments
              </p>
              {!isExperimentRunning ? (
                <>
                  {matches("low 10 rps") && (
                    <button className={itemClass} onClick={() => { onStartExperiment("low"); onClose() }}>
                      <span>Traffic burst, gentle</span>
                      <span className="text-[13px] text-[#86868b]">10 RPS</span>
                    </button>
                  )}
                  {matches("moderate 25 rps") && (
                    <button className={itemClass} onClick={() => { onStartExperiment("moderate"); onClose() }}>
                      <span>Traffic burst, nominal</span>
                      <span className="text-[13px] text-[#86868b]">25 RPS</span>
                    </button>
                  )}
                  {matches("high 50 rps") && (
                    <button className={itemClass} onClick={() => { onStartExperiment("high"); onClose() }}>
                      <span>Traffic burst, maximum</span>
                      <span className="text-[13px] text-[#86868b]">50 RPS</span>
                    </button>
                  )}
                </>
              ) : (
                <button className={itemClass} onClick={() => { onStopExperiment(); onClose() }}>
                  <span>Stop the running experiment</span>
                </button>
              )}
            </div>
          )}

          {(matches("probe") || matches("logs") || matches("terminal") || matches("curl") || matches("metrics")) && (
            <div>
              <p className="px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Tools
              </p>
              {matches("probe test endpoint") && (
                <button className={itemClass} onClick={() => { onPingTarget(); onClose() }}>
                  <span>Probe the test endpoint</span>
                </button>
              )}
              {matches("telemetry terminal logs") && (
                <button className={itemClass} onClick={() => { onToggleLogs(); onClose() }}>
                  <span>{isLogsOpen ? "Hide live activity" : "Show live activity"}</span>
                  <span className="text-[13px] text-[#86868b]">L</span>
                </button>
              )}
              {matches("curl metrics") && (
                <button className={itemClass} onClick={handleCopyMetricsCurl}>
                  <span>{copied ? "Copied" : "Copy metrics cURL"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
