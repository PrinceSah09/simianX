import React, { useCallback, useEffect, useState } from "react"

import { CommandMenu } from "./components/CommandMenu"
import { ExperimentHistoryTable } from "./components/ExperimentHistoryTable"
import { ExperimentPanel } from "./components/ExperimentPanel"
import { ExperimentResultsCard } from "./components/ExperimentResultsCard"
import { InfrastructurePanel } from "./components/InfrastructurePanel"
import { LiveLogsDrawer } from "./components/LiveLogsDrawer"
import { Navbar } from "./components/Navbar"
import { TelemetryGauges } from "./components/TelemetryGauges"
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
import type { Experiment, MetricsData } from "./types/experiment"
import type { BackendHealth } from "./types/health"
import type { InfrastructureData } from "./types/infrastructure"
import type { LogEntry } from "./types/telemetry"

type NavigationTab = "studio" | "history"

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
    duration_seconds: number
    intensity: "low" | "moderate" | "high"
  }) => {
    setIsStarting(true)
    setErrorMessage(null)
    try {
      const exp = await createExperiment({
        scenario: "traffic_burst",
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-[#ededed] flex flex-col font-sans selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-200">
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 space-y-4">
        {/* Sleek Minimal Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-neutral-800 pb-3">
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-neutral-900 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab("studio")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "studio"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-neutral-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Reliability Studio
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-neutral-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              <span>Experiment Archive</span>
              <span className="text-[11px] opacity-75 tabular-nums">({experiments.length})</span>
            </button>
          </div>

          {/* Clean Cluster Health Status Strip */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 dark:text-neutral-200 font-medium">cluster / {infraData?.namespace || "simianx-dev"}</span>
            </span>
            <span className="text-slate-300 dark:text-neutral-700">•</span>
            <span>
              Pods: <strong className="text-emerald-600 dark:text-emerald-400 font-medium">{infraData?.ready_replicas ?? 4}/{infraData?.desired_replicas ?? 4}</strong>
            </span>
            <span className="text-slate-300 dark:text-neutral-700">•</span>
            <span>
              Prometheus: <strong className="text-cyan-600 dark:text-cyan-400 font-medium">{infraData?.prometheus?.connected ? "Syncing (2s)" : "Offline"}</strong>
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

          {/* TAB 2: EXPERIMENT ARCHIVE */}
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
