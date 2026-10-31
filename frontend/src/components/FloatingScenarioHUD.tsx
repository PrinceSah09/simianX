import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Square, X, Loader2, CheckCircle2 } from "lucide-react"
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
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 sm:w-[340px] pointer-events-none">
      <AnimatePresence mode="wait">
        {/* CASE 1: STARTING INITIALIZATION HUD */}
        {isStarting && !isRunning && (
          <motion.div
            key="starting"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="pointer-events-auto rounded-[22px] border border-black/[0.08] bg-white/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
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

        {/* CASE 2: ACTIVE IN-PROGRESS RUNNING HUD (PURE APPLE DESIGN) */}
        {isRunning && activeExperiment && (
          <motion.div
            key="running"
            layout
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="pointer-events-auto rounded-[22px] border border-black/[0.08] bg-white/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)] backdrop-blur-2xl"
          >
            {/* Top Row: Title + Stop Button */}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="truncate text-[15px] font-semibold tracking-tight text-[#1d1d1f] capitalize">
                  {scenarioTitle}
                </h4>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#86868b]">
                  <span className="inline-flex items-center gap-1 font-medium text-[#0071e3]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0071e3]" />
                    Live
                  </span>
                  <span>·</span>
                  <span>{remainingSeconds}s remaining</span>
                  <span>·</span>
                  <span className="capitalize">{activeExperiment.intensity}</span>
                </div>
              </div>

              {/* Apple Tactile Stop Pill Button */}
              <button
                type="button"
                onClick={() => onStop(activeExperiment.id)}
                disabled={isStopping}
                title="Stop simulation"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1 text-[12px] font-medium text-[#dc2626] transition-all hover:bg-[#ff3b30]/10 active:scale-95 disabled:opacity-50"
              >
                <Square className="h-2.5 w-2.5 fill-[#dc2626]" />
                <span>{isStopping ? "Stopping…" : "Stop"}</span>
              </button>
            </div>

            {/* Apple Minimalist Progress Track */}
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <motion.div
                className="h-full rounded-full bg-[#0071e3]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ ease: "linear", duration: 0.25 }}
              />
            </div>

            {/* Bottom Metrics Row (Calm Typographic Hierarchy) */}
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <div>
                <span className="font-semibold tabular-nums text-[#1d1d1f]">
                  {metrics?.requests_per_second && metrics.requests_per_second > 0
                    ? metrics.requests_per_second.toFixed(1)
                    : "—"}
                </span>{" "}
                <span className="text-[#86868b]">RPS</span>
              </div>

              <div>
                <span className="font-semibold tabular-nums text-[#1d1d1f]">
                  {metrics?.p95_latency_ms && metrics.p95_latency_ms > 0
                    ? `${metrics.p95_latency_ms.toFixed(0)} ms`
                    : "—"}
                </span>{" "}
                <span className="text-[#86868b]">P95</span>
              </div>

              <div>
                <span className="font-semibold tabular-nums text-[#1d1d1f]">
                  {infraData?.ready_replicas || 1}
                </span>{" "}
                <span className="text-[#86868b]">pods</span>
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
            className="pointer-events-auto rounded-[22px] border border-black/[0.08] bg-white/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#34c759]/15 text-[#30d158]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">
                    Scenario completed
                  </p>
                  <p className="text-[12px] text-[#86868b]">
                    {completedExperiment.results.achieved_rps} RPS · {completedExperiment.results.total_requests} requests
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onDismissCompleted}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#86868b] transition-colors hover:bg-black/[0.05] hover:text-[#1d1d1f]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
