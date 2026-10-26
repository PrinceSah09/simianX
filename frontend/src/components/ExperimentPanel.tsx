import React, { useEffect, useState } from "react"
import {
  Activity,
  AlertCircle,
  Check,
  Flame,
  Play,
  Sparkles,
  Square,
} from "lucide-react"
import type { Experiment } from "../types/experiment"

interface ExperimentPanelProps {
  activeExperiment: Experiment | null
  onStartExperiment: (params: {
    duration_seconds: number
    intensity: "low" | "moderate" | "high"
  }) => Promise<void>
  onStopExperiment: (id: string) => Promise<void>
  isStarting: boolean
  isStopping: boolean
  errorMessage: string | null
  onClearError: () => void
}

export const ExperimentPanel: React.FC<ExperimentPanelProps> = ({
  activeExperiment,
  onStartExperiment,
  onStopExperiment,
  isStarting,
  isStopping,
  errorMessage,
  onClearError,
}) => {
  const [duration, setDuration] = useState<number>(10)
  const [intensity, setIntensity] = useState<"low" | "moderate" | "high">("low")
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  const isRunning = activeExperiment?.status === "running"

  // Elapsed timer when experiment is running
  useEffect(() => {
    let interval: any = null
    if (isRunning && activeExperiment) {
      const startTime = activeExperiment.started_at
        ? new Date(activeExperiment.started_at).getTime()
        : Date.now()

      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000)
        setElapsedSeconds(seconds)
      }, 500)
    } else {
      setElapsedSeconds(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, activeExperiment])

  const progressPct =
    isRunning && activeExperiment
      ? Math.min(100, (elapsedSeconds / activeExperiment.duration_seconds) * 100)
      : 0

  const handleStart = async () => {
    onClearError()
    await onStartExperiment({
      duration_seconds: duration,
      intensity,
    })
  }

  const handleStop = async () => {
    if (activeExperiment) {
      await onStopExperiment(activeExperiment.id)
    }
  }

  const intensityOptions = [
    {
      id: "low" as const,
      name: "Gentle Surge",
      rps: "10 req/s",
      badge: "Baseline",
      desc: "Warm up pods and verify baseline latency",
      icon: Activity,
      color: "emerald",
    },
    {
      id: "moderate" as const,
      name: "Nominal Burst",
      rps: "25 req/s",
      badge: "Scale Test",
      desc: "Simulate real traffic spike across pods",
      icon: Flame,
      color: "amber",
    },
    {
      id: "high" as const,
      name: "Stress Load",
      rps: "50 req/s",
      badge: "SLO Stress",
      desc: "Push concurrency limits and measure SLO breach",
      icon: Sparkles,
      color: "cyan",
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-neutral-950/80 dark:shadow-2xl transition-all">
      {/* Ambient Top Glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-36 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 dark:bg-emerald-500/[0.04] blur-3xl" />

      {/* 1. Header with Live Status & Target Endpoint */}
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              SRE Experiment Studio
            </h2>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20">
              Traffic Burst
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
            Inject synthetic load to stress-test throughput, test multi-pod routing, and monitor SLO degradation.
          </p>
        </div>

        {/* Live Status Pill & Target Endpoint Chip */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-1 text-xs dark:border-white/[0.06] dark:bg-white/[0.03]">
            <span className="text-slate-400 dark:text-neutral-500">Target:</span>
            <code className="font-mono text-[11px] font-semibold text-slate-700 dark:text-neutral-200">
              /api/v1/test-target
            </code>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              isRunning
                ? "border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                : activeExperiment?.status === "completed"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border border-slate-200 bg-slate-100/70 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRunning
                  ? "bg-amber-500 animate-ping"
                  : activeExperiment?.status === "completed"
                  ? "bg-emerald-500"
                  : "bg-slate-400 dark:bg-neutral-500"
              }`}
            />
            <span>{isRunning ? "Running..." : activeExperiment?.status ? activeExperiment.status : "Ready"}</span>
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-50/90 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-xs font-medium underline hover:text-rose-900 dark:hover:text-white transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Running Progress Card */}
      {isRunning && activeExperiment && (
        <div className="mt-4 relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-3.5 dark:border-amber-500/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                Workload In Flight: {elapsedSeconds}s / {activeExperiment.duration_seconds}s
              </span>
            </div>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-neutral-800 overflow-hidden">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-full"
            />
          </div>
        </div>
      )}

      {/* 2. Interactive Controls Grid */}
      <div className="mt-5 space-y-4">
        {/* Tier Cards: Intensity Selector */}
        <div>
          <div className="flex items-center justify-between pb-2 text-xs">
            <span className="font-medium text-slate-700 dark:text-neutral-300">
              Workload Intensity Tier
            </span>
            <span className="text-slate-400 dark:text-neutral-500 text-[11px]">
              Select target request velocity
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {intensityOptions.map((opt) => {
              const isSelected = intensity === opt.id
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setIntensity(opt.id)}
                  className={`relative flex flex-col justify-between rounded-xl p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border border-emerald-500/60 bg-gradient-to-b from-emerald-500/10 to-transparent dark:from-emerald-500/[0.08] dark:to-transparent dark:border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30"
                      : "border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.04]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                        isSelected
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/[0.06] dark:text-neutral-400 border border-slate-200/80 dark:border-white/10">
                        {opt.badge}
                      </span>
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {opt.name}
                      </h4>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {opt.rps}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration Selector Segmented Bar */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-neutral-300">
                <span>Burst Duration:</span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {duration} seconds
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                Calibrated rolling window execution (min 10s • max 30s)
              </p>
            </div>

            {/* Segmented Duration Pills */}
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-neutral-900 text-xs">
              {[10, 15, 20, 30].map((sec) => {
                const isSelected = duration === sec
                return (
                  <button
                    key={sec}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setDuration(sec)}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {sec}s
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sleek Footer Action Strip */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 dark:border-white/[0.06] pt-4">
        {/* Guardrails summary */}
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            <span>20 Semaphore Concurrency</span>
          </span>
          <span>•</span>
          <span>2.0s Timeout</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400">Safe Loopback</span>
        </div>

        {/* Primary Action Button */}
        <div>
          {isRunning ? (
            <button
              onClick={handleStop}
              disabled={isStopping}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 shadow-md shadow-rose-500/10 transition active:scale-[0.98] disabled:opacity-50"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>{isStopping ? "Halting Workload..." : "Stop Experiment"}</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-xs px-5 py-2.5 shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isStarting ? "Initializing..." : "Start Experiment"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
