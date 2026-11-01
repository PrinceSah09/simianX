import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Square, X, Loader2, CheckCircle2 } from "lucide-react"
import { AnimatedNumber } from "./AnimatedNumber"
import type { Experiment, MetricsData } from "../types/experiment"
import type { InfrastructureData } from "../types/infrastructure"

interface FloatingScenarioHUDProps {
  activeExperiment: Experiment | null
  isStarting: boolean
  isStopping: boolean
  onStop: (id: string) => Promise<void>
  metrics: MetricsData | null
  infraData: InfrastructureData | null
  completedExperiment: Experiment | null
  onDismissCompleted: () => void
}

export const FloatingScenarioHUD: React.FC<FloatingScenarioHUDProps> = ({
  activeExperiment,
  isStarting,
  isStopping,
  onStop,
  metrics,
  infraData,
  completedExperiment,
  onDismissCompleted,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  // Real-time elapsed timer
  useEffect(() => {
    if (!activeExperiment || activeExperiment.status !== "running" || !activeExperiment.started_at) {
      setElapsedSeconds(0)
      return
    }

    const startMs = new Date(activeExperiment.started_at).getTime()
    const updateElapsed = () => {
      const sec = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
      setElapsedSeconds(sec)
    }

    updateElapsed()
    const timer = setInterval(updateElapsed, 250)
    return () => clearInterval(timer)
  }, [activeExperiment?.id, activeExperiment?.status, activeExperiment?.started_at])

  const isRunning = Boolean(activeExperiment && activeExperiment.status === "running")
  const isVisible = isStarting || isRunning || Boolean(completedExperiment)

  if (!isVisible) return null

  const duration = activeExperiment?.duration_seconds || 20
  const progressPct = isRunning ? Math.min(100, Math.round((elapsedSeconds / duration) * 100)) : 0
  const remainingSeconds = Math.max(0, duration - elapsedSeconds)
  const scenarioTitle = (activeExperiment?.scenario || "traffic_burst").replaceAll("_", " ")

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 sm:w-[370px] pointer-events-none">
      <AnimatePresence mode="wait">
        {/* CASE 1: STARTING INITIALIZATION HUD */}
        {isStarting && !isRunning && (
          <motion.div
            key="starting"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="pointer-events-auto rounded-[24px] border border-black/[0.08] bg-white/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold tracking-tight text-[#1d1d1f]">
                  Starting scenario…
                </p>
                <p className="text-[12px] text-[#86868b]">
                  Injecting traffic into cluster
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CASE 2: ACTIVE IN-PROGRESS RUNNING HUD (APPLE LIVE ACTIVITY DESIGN) */}
        {isRunning && activeExperiment && (
          <motion.div
            key="running"
            layout
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="pointer-events-auto rounded-[24px] border border-black/[0.08] bg-white/95 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-3xl"
          >
            {/* Top Row: Title, Live Pulse + Tactical Stop Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0071e3] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0071e3]" />
                  </span>
                  <h4 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-[#1d1d1f] capitalize">
                    {scenarioTitle}
                  </h4>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#86868b]">
                  <span className="font-medium text-[#0071e3]">Active</span>
                  <span className="text-black/20">·</span>
                  <span className="tabular-nums font-medium text-[#6e6e73]">
                    {remainingSeconds}s remaining
                  </span>
                  <span className="text-black/20">·</span>
                  <span className="truncate">
                    {activeExperiment.intensity === "low"
                      ? "10 RPS"
                      : activeExperiment.intensity === "moderate"
                      ? "25 RPS"
                      : "50 RPS max"}
                  </span>
                </div>
              </div>

              {/* Apple Tactile Stop Pill Button */}
              <button
                type="button"
                onClick={() => onStop(activeExperiment.id)}
                disabled={isStopping}
                title="Stop simulation"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#ff3b30]/10 px-3 py-1.5 text-[12px] font-semibold text-[#ff3b30] transition-all hover:bg-[#ff3b30]/15 active:scale-95 disabled:opacity-50"
              >
                <Square className="h-2.5 w-2.5 fill-current" />
                <span>{isStopping ? "Stopping…" : "Stop"}</span>
              </button>
            </div>

            {/* Apple Minimalist Progress Track */}
            <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0071e3] to-[#5e5ce6]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ ease: "linear", duration: 0.25 }}
              />
            </div>

            {/* Bottom Metrics Row (Apple Inset Segmented Display) */}
            <div className="mt-3.5 grid grid-cols-3 divide-x divide-black/[0.06] rounded-[16px] bg-[#f5f5f7]/80 py-2.5 px-1 text-center">
              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868b]">
                  Throughput
                </span>
                <div className="mt-0.5 flex items-baseline gap-0.5 text-[16px] font-semibold tracking-tight text-[#1d1d1f]">
                  <AnimatedNumber
                    value={metrics?.requests_per_second ?? 0}
                    decimals={1}
                    fallback="0.0"
                  />
                  <span className="text-[10px] font-normal text-[#86868b]">rps</span>
                </div>
              </div>

              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868b]">
                  P95 Latency
                </span>
                <div className="mt-0.5 flex items-baseline gap-0.5 text-[16px] font-semibold tracking-tight text-[#1d1d1f]">
                  <AnimatedNumber
                    value={
                      metrics?.p95_latency_ms && metrics.p95_latency_ms > 0
                        ? metrics.p95_latency_ms
                        : null
                    }
                    decimals={0}
                    fallback="—"
                  />
                  <span className="text-[10px] font-normal text-[#86868b]">ms</span>
                </div>
              </div>

              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868b]">
                  Fleet
                </span>
                <div className="mt-0.5 flex items-baseline gap-0.5 text-[16px] font-semibold tracking-tight text-[#1d1d1f]">
                  <AnimatedNumber
                    value={infraData?.ready_replicas || 1}
                    decimals={0}
                  />
                  <span className="text-[10px] font-normal text-[#86868b]">pods</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CASE 3: COMPLETED NOTIFICATION CARD */}
        {completedExperiment && !isRunning && !isStarting && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="pointer-events-auto rounded-[24px] border border-black/[0.08] bg-white/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#34c759]/15 text-[#30d158]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">
                    Scenario completed
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#86868b]">
                    <span className="font-medium text-[#1d1d1f]">
                      {completedExperiment.results.achieved_rps} RPS
                    </span>
                    <span className="mx-1 text-black/20">·</span>
                    <span>{completedExperiment.results.total_requests} requests</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onDismissCompleted}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#86868b] transition-colors hover:bg-black/[0.05] hover:text-[#1d1d1f]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
