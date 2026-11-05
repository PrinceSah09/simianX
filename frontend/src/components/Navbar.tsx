import React from "react"
import { Search, Bell } from "lucide-react"

export type Tab = "studio" | "traces" | "logs" | "history"

interface NavbarProps {
  activeTab: Tab
  isExperimentRunning?: boolean
  onChangeTab: (tab: Tab) => void
  onRefresh?: () => void
  onOpenCommandMenu: () => void
  onOpenSlackAlerts?: () => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "traces", label: "Traces" },
  { id: "logs", label: "Logs" },
  { id: "history", label: "History" },
]

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  isExperimentRunning = false,
  onChangeTab,
  onOpenCommandMenu,
  onOpenSlackAlerts,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-12 border-b border-black/[0.08] bg-[rgba(251,251,253,0.85)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-full max-w-[980px] items-center justify-between px-3 sm:px-5">
        {/* Left: Brand */}
        <div className="flex flex-1 items-center justify-start">
          <button
            type="button"
            onClick={() => onChangeTab("studio")}
            className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.025em] text-[#1d1d1f] transition-opacity hover:opacity-70"
          >
            SimianX
          </button>
        </div>

        {/* Center: Navigation Menu (Symmetrically Centered) */}
        <nav className="flex h-full shrink-0 items-center justify-center gap-2 sm:gap-8 overflow-x-auto overflow-y-hidden no-scrollbar">
          {tabs.map((tab) => {
            const isLogs = tab.id === "logs"
            const showLogsBadge = isLogs && isExperimentRunning
            const isSelected = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`group relative inline-flex h-full items-center gap-1 sm:gap-1.5 px-2 sm:px-1 text-[12.5px] sm:text-[13px] font-medium tracking-[-0.01em] transition-colors whitespace-nowrap ${
                  isSelected
                    ? "text-[#1d1d1f]"
                    : "text-[#1d1d1f]/60 hover:text-[#1d1d1f]"
                }`}
              >
                <span>{tab.label}</span>
                {showLogsBadge && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0071e3]" />
                )}

                {/* Subtle Apple Active Underline Indicator */}
                {isSelected && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] rounded-full bg-[#1d1d1f]" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right: Actions (Symmetrically Balances Left Brand) */}
        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          {onOpenSlackAlerts && (
            <button
              type="button"
              onClick={onOpenSlackAlerts}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] font-medium text-[#1d1d1f]/75 transition-all hover:bg-black/[0.07] hover:text-[#1d1d1f] active:scale-[0.98]"
              title="Slack Alerts"
              aria-label="Slack Alerts"
            >
              <Bell className="h-3.5 w-3.5 text-[#1d1d1f]/75" />
              <span>Alerts</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCommandMenu}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] p-1.5 sm:px-2.5 sm:py-1 text-[12px] text-[#1d1d1f]/75 transition-all hover:bg-black/[0.07] hover:text-[#1d1d1f] active:scale-[0.98]"
            title="Search commands (⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-[#1d1d1f]/75" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline font-sans text-[10.5px] text-[#86868b]">⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
