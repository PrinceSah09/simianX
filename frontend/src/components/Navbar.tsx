import React from "react"
import { Moon, Search, Sun } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
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
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 dark:border-neutral-850 dark:bg-black/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: SimianX Clean Wordmark */}
        <SimianXLogo />

        {/* Center: Command Palette Trigger */}
        <div className="hidden max-w-xs flex-1 px-6 md:block">
          <button
            onClick={onOpenCommandMenu}
            className="flex w-full items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/70 px-2.5 py-1 text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-500 dark:hover:border-neutral-700 dark:hover:text-neutral-300 transition"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3 w-3" />
              <span className="text-[11px]">Search commands...</span>
            </div>
            <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[9px] text-slate-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Operational Status & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            title="Click to ping health"
            className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isHealthy ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span>{isHealthy ? `${health.latency_ms ?? 0}ms` : "Offline"}</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-850 dark:hover:text-white transition"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
