import React from "react"
import { Search } from "lucide-react"
import type { BackendHealth } from "../types/health"
import { SimianXLogo } from "./SimianXLogo"

interface NavbarProps {
  health: BackendHealth
  onRefresh: () => void
  onOpenCommandMenu: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onRefresh,
  onOpenCommandMenu,
}) => {
  const isHealthy = health.status === "healthy"

  return (
    <header className="sticky top-3.5 z-40 w-full px-4 sm:px-6">
      <div className="mx-auto flex h-13 max-w-6xl items-center justify-between rounded-full bg-zinc-950/70 border border-white/[0.08] px-4 sm:px-5 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Left: Brand Logo */}
        <SimianXLogo height={22} />

        {/* Center: Search Command Bar (Apple Spotlight style) */}
        <div className="hidden sm:block flex-1 max-w-sm px-4">
          <button
            onClick={onOpenCommandMenu}
            className="flex w-full items-center justify-between rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="text-[11px] font-sans">Search commands & chaos...</span>
            </div>
            <kbd className="rounded-md bg-white/[0.08] border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Operational Health Status Indicator */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            title="Click to ping cluster health"
            className="flex items-center gap-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1 text-xs font-mono font-medium text-zinc-300 border border-white/[0.06] transition-colors cursor-pointer"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isHealthy
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"
                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              }`}
            />
            <span>{isHealthy ? `${health.latency_ms ?? 0}ms` : "Offline"}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
