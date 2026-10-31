import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  Play,
  Square,
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
      title: "Traffic burst",
      desc: "A short surge, to see how the fleet absorbs load.",
    },
    {
      id: "latency_spike" as ScenarioType,
      title: "Tail latency",
      desc: "Added delay, so timeouts and P99 show up.",
    },
    {
      id: "error_spike" as ScenarioType,
      title: "Fault injection",
      desc: "Errors on part of the traffic, against the error budget.",
    },
    {
      id: "memory_saturation" as ScenarioType,
      title: "Memory pressure",
      desc: "A rising heap, toward the container limit.",
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
    <div className="rounded-[28px] bg-white px-6 py-8 sm:px-10 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f] sm:text-[40px]">
          Run a scenario.
        </h2>
        {isRunning && activeExperiment && (
          <p className="text-[17px] text-[#0066cc]">
            {elapsedSeconds}s of {activeExperiment.duration_seconds}s
          </p>
        )}
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 flex items-center justify-between rounded-2xl bg-[#fff5f5] px-4 py-3 text-[15px] text-[#ff3b30]"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={onClearError}
              className="ml-3 text-[15px] text-[#0066cc] hover:underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 space-y-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {chaosScenarios.map((item) => {
            const isSelected = scenario === item.id
            return (
              <button
                key={item.id}
                type="button"
                disabled={isRunning}
                onClick={() => setScenario(item.id)}
                className={`rounded-[22px] px-5 py-6 text-left transition-colors duration-300 ${
                  isSelected ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                } ${isRunning ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <h3 className="text-[19px] font-semibold tracking-[-0.03em]">{item.title}</h3>
                <p className={`mt-2 text-[14px] leading-snug ${isSelected ? "text-white/70" : "text-[#6e6e73]"}`}>
                  {item.desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* Controls Grid: Intensity Segmented Control + Duration Slider */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 text-[14px] text-[#6e6e73]">Intensity</p>
            <div className="flex rounded-full bg-[#f5f5f7] p-1">
              {intensityOptions.map((opt) => {
                const isSelected = intensity === opt.id

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setIntensity(opt.id)}
                    className={`relative z-10 flex-1 rounded-full py-2 text-center text-[13px] transition-all ${
                      isSelected ? "text-[#1d1d1f]" : "text-[#6e6e73] hover:text-[#1d1d1f]"
                    } ${isRunning ? "cursor-not-allowed" : ""}`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeIntensityPill"
                        className="absolute inset-0 rounded-full bg-white shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="relative z-20">
                      <span className="block text-[14px] font-medium">{opt.label}</span>
                      <span className="text-[12px] text-[#86868b]">{opt.rps}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Apple-style Duration Slider */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-[14px] text-[#6e6e73]">Duration</p>
              <p className="text-[14px] text-[#1d1d1f]">{duration} seconds</p>
            </div>
            <div className="flex rounded-full bg-[#f5f5f7] p-1">
              {[10, 15, 20, 25, 30].map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setDuration(seconds)}
                  className={`flex-1 rounded-full py-2 text-[14px] ${
                    duration === seconds ? "bg-white font-medium text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"
                  } disabled:opacity-50`}
                >
                  {seconds}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Active Experiment Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-[13px] text-[#6e6e73]">
              <span>{activeExperiment?.scenario.replaceAll("_", " ")}</span>
              <span>
                {elapsedSeconds}s / {activeExperiment?.duration_seconds}s
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8e8ed]">
              <motion.div
                className="h-full rounded-full bg-[#0071e3]"
                style={{ width: `${progressPct}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </div>
        )}

        {/* Action Button: Apple Tactile Style */}
        <div className="pt-1">
          {isRunning ? (
            <button
              onClick={handleStop}
              disabled={isStopping}
              className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-2 text-[17px] text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
              {isStopping ? "Stopping…" : "Stop"}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2 text-[17px] text-white transition-colors hover:bg-[#0077ed] disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              {isStarting ? "Starting…" : "Run scenario"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
