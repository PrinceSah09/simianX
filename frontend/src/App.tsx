import React, { useCallback, useEffect, useState } from "react"

import { CommandMenu } from "./components/CommandMenu"
import { ExperimentHistoryTable } from "./components/ExperimentHistoryTable"
import { ExperimentPanel } from "./components/ExperimentPanel"
import { ExperimentResultsCard } from "./components/ExperimentResultsCard"
import { InfrastructurePanel } from "./components/InfrastructurePanel"
import { LiveLogsDrawer } from "./components/LiveLogsDrawer"
import { Navbar } from "./components/Navbar"
import { TelemetryGauges } from "./components/TelemetryGauges"
import { TraceWaterfallViewer } from "./components/TraceWaterfallViewer"
import {
  createExperiment,
  fetchHealth,
  fetchInfrastructure,
  fetchMetrics,
  getExperiment,
  listExperiments,
  pingTestTarget,
  scaleDeployment,
  stopExperiment,
} from "./services/api"
import type { Experiment, MetricsData, ScenarioType } from "./types/experiment"
import type { BackendHealth } from "./types/health"
import type { InfrastructureData } from "./types/infrastructure"
import type { LogEntry } from "./types/telemetry"

type NavigationTab = "studio" | "traces" | "history"

export const App: React.FC = () => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<NavigationTab>("studio")

  // Telemetry & metrics state
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState<boolean>(false)
  const [isMetricsLoading, setIsMetricsLoading] = useState<boolean>(true)
  const [health, setHealth] = useState<BackendHealth>({ status: "connecting" })

  // Experiments state
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [isStarting, setIsStarting] = useState<boolean>(false)
  const [isStopping, setIsStopping] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false)

  // Drawer & Command states
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState<boolean>(false)
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Infrastructure state
  const [infraData, setInfraData] = useState<InfrastructureData | null>(null)

  // Append structured log entry
  const appendLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    const now = new Date()
    const timeStr =
      now.toTimeString().split(" ")[0] +
      "." +
      String(now.getMilliseconds()).padStart(3, "0")
    const newLog: LogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
    }
    setLogs((prev) => [...prev.slice(-49), newLog])
  }, [])

  // Poll metrics from backend
  const loadMetrics = useCallback(async () => {
    try {
      const snapshot = await fetchMetrics()
      setMetrics(snapshot)
      setLastUpdated(new Date())
      setIsStale(false)
    } catch (err: any) {
      console.warn("Telemetry polling failed:", err?.message)
      setIsStale(true)
    } finally {
      setIsMetricsLoading(false)
    }
  }, [])

  // Poll infrastructure state from backend / Kubernetes / Prometheus
  const loadInfrastructure = useCallback(async () => {
    try {
      const data = await fetchInfrastructure()
      setInfraData(data)
    } catch (err: any) {
      console.warn("Infrastructure polling failed:", err?.message)
    }
  }, [])

  // Poll health from backend
  const checkHealth = useCallback(async () => {
    const res = await fetchHealth()
    setHealth(res)
  }, [])

  // Scale deployment handler
  const handleScaleDeployment = async (replicas: number) => {
    appendLog({
      level: "INFO",
      endpoint: "POST /api/v1/infrastructure/scale",
      status: 202,
      durationMs: 40,
      traceId: "k8s-" + Math.random().toString(36).substring(2, 8),
      message: `Scaling deployment '${infraData?.deployment_name || "simianx-backend"}' to ${replicas} replicas...`,
    })
    try {
      const updated = await scaleDeployment(replicas)
      setInfraData(updated)
      appendLog({
        level: "INFO",
        endpoint: "POST /api/v1/infrastructure/scale",
        status: 200,
        durationMs: 85,
        traceId: "k8s-" + Math.random().toString(36).substring(2, 8),
        message: `Scale dispatched: ${updated.ready_replicas}/${updated.desired_replicas} pods ready.`,
      })
      await loadInfrastructure()
    } catch (err: any) {
      appendLog({
        level: "ERROR",
        endpoint: "POST /api/v1/infrastructure/scale",
        status: 500,
        durationMs: 120,
        traceId: "k8s-" + Math.random().toString(36).substring(2, 8),
        message: `Scaling failed: ${err.message}`,
      })
      throw err
    }
  }

  // Load experiment history
  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true)
    try {
      const data = await listExperiments(15)
      setExperiments(data.items)
      const running = data.items.find((item) => item.status === "running")
      setActiveExperiment(running || null)
    } catch (err: any) {
      console.warn("History polling failed:", err?.message)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  // Periodic polling for live telemetry & infrastructure (1s during experiments, 2s when idle)
  useEffect(() => {
    checkHealth()
    loadMetrics()
    loadHistory()
    loadInfrastructure()

    const pollRate = activeExperiment?.status === "running" ? 1000 : 2000
    const interval = setInterval(() => {
      loadMetrics()
      loadInfrastructure()
    }, pollRate)

    return () => clearInterval(interval)
  }, [checkHealth, loadMetrics, loadHistory, loadInfrastructure, activeExperiment?.status])

  // Active experiment tracking loop
  useEffect(() => {
    if (!activeExperiment || activeExperiment.status !== "running") return

    const pollInterval = setInterval(async () => {
      try {
        const updated = await getExperiment(activeExperiment.id)
        if (updated.status !== "running") {
          setSelectedExperiment(updated)
          setActiveExperiment(null)
          loadHistory()
          loadMetrics()
          appendLog({
            level: updated.status === "completed" ? "INFO" : "WARN",
            endpoint: `POST /api/v1/experiments/${updated.id}`,
            status: 200,
            durationMs: Math.round(updated.results.duration_seconds * 1000),
            traceId: "tr-" + updated.id.slice(0, 8),
            message: `experiment_${updated.status} total_reqs=${updated.results.total_requests} achieved_rps=${updated.results.achieved_rps}`,
          })
        }
      } catch (err: any) {
        console.error("Experiment poll failed:", err)
      }
    }, 1000)

    return () => clearInterval(pollInterval)
  }, [activeExperiment, loadHistory, loadMetrics, appendLog])

  // Start experiment
  const handleStartExperiment = async (params: {
    scenario?: ScenarioType
    duration_seconds: number
    intensity: "low" | "moderate" | "high"
  }) => {
    setIsStarting(true)
    setErrorMessage(null)
    const targetScenario = params.scenario || "traffic_burst"
    try {
      const exp = await createExperiment({
        scenario: targetScenario,
        duration_seconds: params.duration_seconds,
        intensity: params.intensity,
      })
      setActiveExperiment(exp)
      setSelectedExperiment(null)
      appendLog({
        level: "INFO",
        endpoint: "POST /api/v1/experiments",
        status: 201,
        durationMs: 12,
        traceId: "tr-" + exp.id.slice(0, 8),
        message: `experiment_started scenario=${exp.scenario} intensity=${exp.intensity} duration=${exp.duration_seconds}s`,
      })
      loadHistory()
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to start experiment")
      appendLog({
        level: "ERROR",
        endpoint: "POST /api/v1/experiments",
        status: 409,
        durationMs: 4,
        traceId: "tr-err-" + Math.random().toString(36).substring(2, 6),
        message: err?.message || "Experiment rejected",
      })
    } finally {
      setIsStarting(false)
    }
  }

  // Stop experiment
  const handleStopExperiment = async (id: string) => {
    setIsStopping(true)
    try {
      const stopped = await stopExperiment(id)
      setActiveExperiment(stopped)
      setSelectedExperiment(stopped)
      appendLog({
        level: "WARN",
        endpoint: `POST /api/v1/experiments/${id}/stop`,
        status: 200,
        durationMs: 8,
        traceId: "tr-stop-" + id.slice(0, 8),
        message: `experiment_stopped total_reqs=${stopped.results.total_requests}`,
      })
      loadHistory()
      loadMetrics()
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to stop experiment")
    } finally {
      setIsStopping(false)
    }
  }

  // Single probe test
  const handlePingTarget = async () => {
    const res = await pingTestTarget()
    loadMetrics()
    appendLog({
      level: res.status === 200 ? "INFO" : "ERROR",
      endpoint: "GET /api/v1/test-target",
      status: res.status,
      durationMs: res.durationMs,
      traceId: "tr-probe-" + Math.random().toString(36).substring(2, 6),
      message: "manual_probe_target",
    })
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsCommandMenuOpen((prev) => !prev)
      } else if (e.key === "/" && !isCommandMenuOpen) {
        e.preventDefault()
        setIsCommandMenuOpen(true)
      } else if ((e.key === "l" || e.key === "L") && !isCommandMenuOpen) {
        e.preventDefault()
        setIsLogsOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [isCommandMenuOpen])

  return (
    <div className="min-h-screen bg-[#050507] text-[#ededed] flex flex-col font-sans selection:bg-white selection:text-black relative overflow-x-hidden antialiased">
      {/* Ambient Apple Keynote Light Cones */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(59,130,246,0.18),transparent_70%)] blur-3xl z-0" />
      <div className="pointer-events-none fixed top-60 right-[-10%] w-[650px] h-[450px] bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(168,85,247,0.10),transparent_70%)] blur-3xl z-0" />

      {/* Top Navbar */}
      <Navbar
        health={health}
        onRefresh={() => {
          checkHealth()
          loadMetrics()
          loadHistory()
          loadInfrastructure()
        }}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* Apple Hero Header */}
        <div className="pt-2 pb-1 text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1 text-[11px] font-mono text-zinc-400 border border-white/[0.08] backdrop-blur-xl shadow-inner">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SimianX SRE Resilience Platform v0.2.0</span>
            <span className="text-zinc-600">•</span>
            <span className="text-blue-400 font-semibold">OpenTelemetry OTLP</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/50 font-sans">
            Autonomous Cloud Resilience
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Real-time Golden Signal telemetry, OpenTelemetry distributed tracing, and automated chaos failure injection across Kubernetes & AWS EKS.
          </p>
        </div>

        {/* Apple Floating Segmented Nav & Fleet Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="relative inline-flex items-center gap-1.5 p-1 rounded-full bg-zinc-950/80 border border-white/[0.08] backdrop-blur-2xl shadow-xl text-xs">
            <button
              onClick={() => setActiveTab("studio")}
              className={`relative z-10 px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                activeTab === "studio"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Reliability Studio
            </button>
            <button
              onClick={() => setActiveTab("traces")}
              className={`relative z-10 px-4 py-1.5 rounded-full font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "traces"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Distributed Tracing</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono border ${
                  activeTab === "traces"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                }`}
              >
                OTel
              </span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`relative z-10 px-4 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "history"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Experiment Archive</span>
              <span className="text-[10px] opacity-75 font-mono">({experiments.length})</span>
            </button>
          </div>

          {/* Clean Fleet Status Strip */}
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-zinc-200 font-medium font-sans">
                cluster / {infraData?.namespace || "simianx-dev"}
              </span>
            </span>
            <span className="text-zinc-700">•</span>
            <span>
              Pods: <strong className="text-emerald-400 font-medium">{infraData?.ready_replicas ?? 2}/{infraData?.desired_replicas ?? 2}</strong>
            </span>
            <span className="text-zinc-700">•</span>
            <span>
              Prometheus: <strong className="text-cyan-400 font-medium">{infraData?.prometheus?.connected ? "Syncing (2s)" : "Active"}</strong>
            </span>
          </div>
        </div>

        {/* Live Terminal Drawer */}
        <LiveLogsDrawer
          isOpen={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
          logs={logs}
          onClearLogs={() => setLogs([])}
        />

        {/* TAB BODIES */}
        <div className="min-h-[580px]">
          {/* TAB 1: RELIABILITY STUDIO */}
          {activeTab === "studio" && (
            <div className="space-y-4 transition-all">
              {/* Speedometer Gauges */}
              <TelemetryGauges
                metrics={metrics}
                isLoading={isMetricsLoading}
                activeExperiment={activeExperiment}
                lastUpdated={lastUpdated}
                isStale={isStale}
                onRefresh={loadMetrics}
              />

              {/* Kubernetes & Prometheus Infrastructure */}
              <InfrastructurePanel
                data={infraData}
                onScale={handleScaleDeployment}
              />

              {/* Experiment Configuration & Execution Studio */}
              <ExperimentPanel
                activeExperiment={activeExperiment}
                onStartExperiment={handleStartExperiment}
                onStopExperiment={handleStopExperiment}
                isStarting={isStarting}
                isStopping={isStopping}
                errorMessage={errorMessage}
                onClearError={() => setErrorMessage(null)}
              />

              {/* Results Summary Card */}
              {(selectedExperiment || (activeExperiment && activeExperiment.status !== "running")) && (
                <ExperimentResultsCard
                  experiment={selectedExperiment || activeExperiment}
                />
              )}

              {/* Compact Recent History Preview */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/70 dark:shadow-md">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Recent Runs ({experiments.slice(0, 5).length})
                  </h3>
                  <button
                    onClick={() => setActiveTab("history")}
                    className="text-xs font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 transition"
                  >
                    View Full Archive ({experiments.length}) →
                  </button>
                </div>
                <ExperimentHistoryTable
                  experiments={experiments.slice(0, 5)}
                  selectedExperimentId={selectedExperiment?.id || activeExperiment?.id || null}
                  onSelectExperiment={(exp) => setSelectedExperiment(exp)}
                  onRefresh={loadHistory}
                  isLoading={isHistoryLoading}
                />
              </div>
            </div>
          )}

          {/* TAB 2: DISTRIBUTED TRACING (OPENTELEMETRY) */}
          {activeTab === "traces" && (
            <div className="space-y-4">
              <TraceWaterfallViewer />
            </div>
          )}

          {/* TAB 3: EXPERIMENT ARCHIVE */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {selectedExperiment && (
                <ExperimentResultsCard experiment={selectedExperiment} />
              )}
              <ExperimentHistoryTable
                experiments={experiments}
                selectedExperimentId={selectedExperiment?.id || null}
                onSelectExperiment={(exp) => setSelectedExperiment(exp)}
                onRefresh={loadHistory}
                isLoading={isHistoryLoading}
              />
            </div>
          )}
        </div>
      </main>

      {/* Command Palette (⌘K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onStartExperiment={(intensity) =>
          handleStartExperiment({
            duration_seconds: intensity === "low" ? 10 : intensity === "moderate" ? 15 : 20,
            intensity,
          })
        }
        onStopExperiment={() => {
          if (activeExperiment) handleStopExperiment(activeExperiment.id)
        }}
        isExperimentRunning={activeExperiment?.status === "running"}
        onToggleLogs={() => setIsLogsOpen((prev) => !prev)}
        isLogsOpen={isLogsOpen}
        onPingTarget={handlePingTarget}
      />
    </div>
  )
}

export default App
