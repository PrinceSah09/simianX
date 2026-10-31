import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  Clock,
  Cpu,
  Gauge,
  Play,
  ShieldAlert,
  Square,
  Zap,
} from "lucide-react"
import type { Experiment, ScenarioType } from "../types/experiment"

interface ExperimentPanelProps {
  activeExperiment: Experiment | null
  onStartExperiment: (params: {
    scenario: ScenarioType
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
  const [scenario, setScenario] = useState<ScenarioType>("traffic_burst")
  const [duration, setDuration] = useState<number>(15)
  const [intensity, setIntensity] = useState<"low" | "moderate" | "high">("low")
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  const isRunning = activeExperiment?.status === "running"

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
      scenario,
      duration_seconds: duration,
      intensity,
    })
  }

  const handleStop = async () => {
    if (activeExperiment) {
      await onStopExperiment(activeExperiment.id)
    }
  }

  const chaosScenarios = [
    {
      id: "traffic_burst" as ScenarioType,
      title: "Traffic Burst",
      category: "Throughput & Autoscaling",
      desc: "Simulate concurrent load spikes to verify pod autoscaling and ingress saturation.",
      icon: Zap,
      accent: "from-blue-500/20 to-indigo-500/10",
      activeBorder: "border-blue-500/40",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      id: "latency_spike" as ScenarioType,
      title: "P99 Tail Latency",
      category: "Downstream Jitter",
      desc: "Inject artificial Gaussian delays (250ms–1.2s) to test timeout resilience and P99 divergence.",
      icon: Gauge,
      accent: "from-amber-500/20 to-orange-500/10",
      activeBorder: "border-amber-500/40",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      id: "error_spike" as ScenarioType,
      title: "Fault Injection",
      category: "Circuit Breakers",
      desc: "Inject cascading HTTP 500/503 errors on ~35% of requests to test error budget consumption.",
      icon: ShieldAlert,
      accent: "from-red-500/20 to-rose-500/10",
      activeBorder: "border-red-500/40",
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    {
      id: "memory_saturation" as ScenarioType,
      title: "Memory Saturation",
      category: "cgroup Exhaustion",
      desc: "Allocate ephemeral memory buffers to simulate memory leaks and cgroup limit alerts.",
      icon: Cpu,
      accent: "from-purple-500/20 to-violet-500/10",
      activeBorder: "border-purple-500/40",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
  ]

  const intensityOptions = [
    {
      id: "low" as const,
      label: "Gentle",
      rps: "10 RPS",
      description: "Baseline warm up",
    },
    {
      id: "moderate" as const,
      label: "Nominal",
      rps: "25 RPS",
      description: "Typical load surge",
    },
    {
      id: "high" as const,
      label: "Maximum",
      rps: "50 RPS",
      description: "SLO stress limit",
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900/60 p-5 sm:p-6 border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
      {/* Subtle Apple Ambient Highlight */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-44 w-[480px] -translate-x-1/2 rounded-full bg-blue-500/[0.04] blur-3xl" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isRunning ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
              }`}
            />
            <h2 className="text-sm font-semibold tracking-tight text-white">
              SRE Chaos & Resilience Studio
            </h2>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-white/[0.08]">
              OpenTelemetry Instrumented
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Execute controlled reliability scenarios to stress Golden Signals and capture distributed traces.
          </p>
        </div>

        {/* Live Running Status Pill */}
        {isRunning && activeExperiment && (
          <div className="flex items-center gap-2.5 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-mono font-medium text-amber-400 border border-amber-500/20 shadow-sm animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            <span>
              RUNNING ({elapsedSeconds}s / {activeExperiment.duration_seconds}s)
            </span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 flex items-center justify-between rounded-xl bg-red-500/10 p-3 text-xs text-red-300 border border-red-500/20"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={onClearError}
              className="text-red-400 hover:text-red-200 font-medium text-xs ml-3"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 space-y-5">
        {/* Scenario Selection Grid */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2.5">
            Select Failure Injection Scenario
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {chaosScenarios.map((item) => {
              const Icon = item.icon
              const isSelected = scenario === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setScenario(item.id)}
                  className={`group relative flex flex-col justify-between rounded-xl p-3.5 text-left transition-all ${
                    isSelected
                      ? `bg-white/[0.08] ${item.activeBorder} shadow-lg ring-1 ring-white/10`
                      : "bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04]"
                  } ${isRunning ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 transition-colors`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-medium border ${item.badgeColor}`}
                    >
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-white tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-400 line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Controls Grid: Intensity Segmented Control + Duration Slider */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
          {/* Apple-style Intensity Segmented Control */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
              Workload Intensity
            </label>
            <div className="relative flex rounded-xl bg-zinc-950/70 p-1 border border-white/[0.08]">
              {intensityOptions.map((opt) => {
                const isSelected = intensity === opt.id

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setIntensity(opt.id)}
                    className={`relative z-10 flex-1 rounded-lg py-2 text-center text-xs font-medium transition-all ${
                      isSelected
                        ? "text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeIntensityPill"
                        className="absolute inset-0 rounded-lg bg-white/[0.12] border border-white/10 shadow-inner"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="relative z-20">
                      <span className="block font-semibold">{opt.label}</span>
                      <span className="text-[10px] font-mono text-zinc-400">{opt.rps}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Apple-style Duration Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Duration (Seconds)
              </label>
              <span className="text-xs font-mono font-semibold text-white">
                {duration}s
              </span>
            </div>
            <div className="rounded-xl bg-zinc-950/70 p-3 border border-white/[0.08]">
              <input
                type="range"
                min={10}
                max={30}
                step={5}
                disabled={isRunning}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2">
                <span>10s</span>
                <span>15s</span>
                <span>20s</span>
                <span>25s</span>
                <span>30s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Experiment Progress Bar */}
        {isRunning && (
          <div className="rounded-xl bg-zinc-950/70 p-3 border border-white/[0.08] space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-300">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                Workload In-Flight: {activeExperiment?.scenario}
              </span>
              <span>
                {elapsedSeconds}s / {activeExperiment?.duration_seconds}s ({Math.round(progressPct)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500"
                style={{ width: `${progressPct}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </div>
        )}

        {/* Action Button: Apple Tactile Style */}
        <div className="pt-2">
          {isRunning ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleStop}
              disabled={isStopping}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/90 hover:bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 border border-red-500/30 transition-all cursor-pointer"
            >
              <Square className="h-4 w-4 fill-white" />
              {isStopping ? "Halting Workload..." : "Abort Experiment Immediately"}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              disabled={isStarting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 border border-blue-400/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-white" />
              {isStarting ? "Dispatching Load..." : `Launch ${chaosScenarios.find(c => c.id === scenario)?.title}`}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
