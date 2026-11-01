import React from "react"

export type Tab = "studio" | "traces" | "logs" | "history"

interface NavbarProps {
  activeTab: Tab
  archiveCount: number
  isExperimentRunning?: boolean
  onChangeTab: (tab: Tab) => void
  onRefresh?: () => void
  onOpenCommandMenu: () => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "traces", label: "Traces" },
  { id: "logs", label: "Logs" },
  { id: "history", label: "Archive" },
]

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  archiveCount,
  isExperimentRunning = false,
  onChangeTab,
  onOpenCommandMenu,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-12 border-b border-black/[0.08] bg-[rgba(251,251,253,0.78)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-full max-w-[980px] items-center justify-between px-5">
        {/* Left: Brand (Fixed width for exact center alignment of nav menu) */}
        <div className="flex w-24 shrink-0 items-center justify-start sm:w-28">
          <button
            type="button"
            onClick={() => onChangeTab("studio")}
            className="text-[16px] font-semibold tracking-[-0.025em] text-[#1d1d1f] transition-opacity hover:opacity-70"
          >
            SimianX
          </button>
        </div>

        {/* Center: Navigation Menu (Centered Apple HIG Navigation) */}
        <nav className="flex items-center justify-center gap-6 sm:gap-8">
          {tabs.map((tab) => {
            const isArchive = tab.id === "history"
            const isLogs = tab.id === "logs"
            const showArchiveBadge = isArchive && archiveCount > 0
            const showLogsBadge = isLogs && isExperimentRunning
            const isSelected = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`group relative inline-flex items-center gap-1.5 py-1 text-[13px] tracking-[-0.01em] transition-colors ${
                  isSelected
                    ? "font-medium text-[#1d1d1f]"
                    : "text-[#1d1d1f]/65 hover:text-[#1d1d1f]"
                }`}
              >
                <span>{tab.label}</span>
                {showArchiveBadge && (
                  <span className="rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[#6e6e73]">
                    {archiveCount}
                  </span>
                )}
                {showLogsBadge && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0071e3]" />
                )}

                {/* Subtle Apple Active Underline Indicator */}
                {isSelected && (
                  <span className="absolute -bottom-[13px] inset-x-0 h-[2px] rounded-full bg-[#1d1d1f]" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right: Search Action (Balanced with left width) */}
        <div className="flex w-24 shrink-0 items-center justify-end sm:w-28">
          <button
            type="button"
            onClick={onOpenCommandMenu}
            className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] text-[#1d1d1f]/75 transition-all hover:bg-black/[0.07] hover:text-[#1d1d1f] active:scale-[0.98]"
          >
            <span>Search</span>
            <kbd className="font-sans text-[10.5px] text-[#86868b]">⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
