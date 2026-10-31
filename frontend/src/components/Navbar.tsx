import React from "react"
import type { BackendHealth } from "../types/health"

type Tab = "studio" | "traces" | "history"

interface NavbarProps {
  health: BackendHealth
  activeTab: Tab
  archiveCount: number
  onChangeTab: (tab: Tab) => void
  onRefresh: () => void
  onOpenCommandMenu: () => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "traces", label: "Traces" },
  { id: "history", label: "Archive" },
]

export const Navbar: React.FC<NavbarProps> = ({
  health,
  activeTab,
  archiveCount,
  onChangeTab,
  onRefresh,
  onOpenCommandMenu,
}) => {
  const isHealthy = health.status === "healthy"

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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`text-[12px] tracking-[-0.01em] transition-colors ${
                activeTab === tab.id ? "text-[#1d1d1f]" : "text-[#1d1d1f]/70 hover:text-[#1d1d1f]"
              }`}
            >
              {tab.id === "history" ? `${tab.label} ${archiveCount}` : tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <button
            onClick={onOpenCommandMenu}
            className="hidden items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1 text-[12px] text-[#1d1d1f]/70 transition-colors hover:bg-black/[0.06] hover:text-[#1d1d1f] sm:inline-flex"
          >
            Search
            <kbd className="font-sans text-[11px] text-[#86868b]">⌘K</kbd>
          </button>
          <button
            onClick={onRefresh}
            title="Ping cluster health"
            className="text-[12px] text-[#0066cc] hover:underline"
          >
            {isHealthy ? `${health.latency_ms ?? 0} ms` : "Offline"}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
