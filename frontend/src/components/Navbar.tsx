import React from "react"
import { Terminal } from "lucide-react"
import type { BackendHealth } from "../types/health"

type Tab = "studio" | "traces" | "history"

interface NavbarProps {
  health?: BackendHealth
  activeTab: Tab
  archiveCount: number
  onChangeTab: (tab: Tab) => void
  onRefresh?: () => void
  onOpenCommandMenu: () => void
  isLogsOpen?: boolean
  onToggleLogs?: () => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "traces", label: "Traces" },
  { id: "history", label: "Archive" },
]

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  archiveCount,
  onChangeTab,
  onOpenCommandMenu,
  isLogsOpen = false,
  onToggleLogs,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-12 border-b border-black/[0.08] bg-[rgba(251,251,253,0.72)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-full max-w-[980px] items-center justify-between px-5">
        <button
          onClick={() => onChangeTab("studio")}
          className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]"
        >
          SimianX
        </button>

        <nav className="flex items-center gap-5 sm:gap-7">
          {tabs.map((tab) => {
            const isArchive = tab.id === "history"
            const showBadge = isArchive && archiveCount > 0

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`inline-flex items-center gap-1.5 text-[12px] tracking-[-0.01em] transition-colors ${
                  activeTab === tab.id
                    ? "font-medium text-[#1d1d1f]"
                    : "text-[#1d1d1f]/70 hover:text-[#1d1d1f]"
                }`}
              >
                <span>{tab.label}</span>
                {showBadge && (
                  <span className="rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[#6e6e73]">
                    {archiveCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {onToggleLogs && (
            <button
              onClick={onToggleLogs}
              title="Toggle live logs (L)"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all ${
                isLogsOpen
                  ? "bg-[#1d1d1f] text-white shadow-sm"
                  : "bg-black/[0.04] text-[#1d1d1f]/80 hover:bg-black/[0.08] hover:text-[#1d1d1f]"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Logs</span>
              <kbd
                className={`hidden font-sans text-[10.5px] sm:inline ${
                  isLogsOpen ? "text-white/70" : "text-[#86868b]"
                }`}
              >
                L
              </kbd>
            </button>
          )}

          <button
            onClick={onOpenCommandMenu}
            className="hidden items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1 text-[12px] text-[#1d1d1f]/70 transition-colors hover:bg-black/[0.06] hover:text-[#1d1d1f] sm:inline-flex"
          >
            Search
            <kbd className="font-sans text-[11px] text-[#86868b]">⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
