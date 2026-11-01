import React, { useCallback, useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { CommandMenu } from "./components/CommandMenu"
import { ExperimentHistoryTable } from "./components/ExperimentHistoryTable"
import { ExperimentDetailModal } from "./components/ExperimentDetailModal"
import { ExperimentPanel } from "./components/ExperimentPanel"
import { ExperimentResultsCard } from "./components/ExperimentResultsCard"
import { FloatingScenarioHUD } from "./components/FloatingScenarioHUD"
import { InfrastructurePanel } from "./components/InfrastructurePanel"
import { LiveLogsViewer } from "./components/LiveLogsViewer"
import { Navbar } from "./components/Navbar"
import { TelemetryGauges } from "./components/TelemetryGauges"
import { TraceWaterfallViewer } from "./components/TraceWaterfallViewer"
import {
  clearLiveLogs,
  createExperiment,
  fetchHealth,
  fetchInfrastructure,
  fetchLiveLogs,
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
import { useToast } from "./context/ToastContext"

type NavigationTab = "studio" | "traces" | "logs" | "history"

export const App: React.FC = () => {
  const { showToast } = useToast()
  // Navigation tab state (synced with URL hash)
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, "")
    if (hash === "logs") return "logs"
    if (hash === "traces") return "traces"
    if (hash === "archive" || hash === "history") return "history"
    return "studio"
  })

  const handleTabChange = useCallback((tab: NavigationTab) => {
    setActiveTab(tab)
    setInspectingExperiment(null)
    window.location.hash = `#/${tab}`
  }, [])

  // Sync state if browser back/forward or hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setInspectingExperiment(null)
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, "")
      if (hash === "logs") setActiveTab("logs")
      else if (hash === "traces") setActiveTab("traces")
      else if (hash === "archive" || hash === "history") setActiveTab("history")
      else if (hash === "studio") setActiveTab("studio")
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  // Telemetry & metrics state
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState<boolean>(false)
  const [isMetricsLoading, setIsMetricsLoading] = useState<boolean>(true)
  const [, setHealth] = useState<BackendHealth>({ status: "connecting" })

  // Experiments state
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [inspectingExperiment, setInspectingExperiment] = useState<Experiment | null>(null)
  const [completedExperiment, setCompletedExperiment] = useState<Experiment | null>(null)
  const [isStarting, setIsStarting] = useState<boolean>(false)
  const [isStopping, setIsStopping] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false)

  // Drawer & Command states
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState<boolean>(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const resultsCardRef = useRef<HTMLDivElement>(null)

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
    setLogs((prev) => [...prev.slice(-199), newLog])
  }, [])

  // Poll granular request logs from backend
  const loadLiveLogs = useCallback(async () => {
    try {
      const data = await fetchLiveLogs(200)
      if (data.items && data.items.length > 0) {
        setLogs(data.items)
      }
    } catch (err: any) {
      console.debug("Live logs polling error:", err?.message)
    }
  }, [])

  const handleClearLogs = async () => {
    setLogs([])
    try {
      await clearLiveLogs()
    } catch (err) {
      console.debug("Failed to clear logs:", err)
    }
  }

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

  // Live granular request logs polling
  useEffect(() => {
    loadLiveLogs()
    // Poll logs rapidly (400ms) when experiment running or Logs tab active
    const isFast = activeExperiment?.status === "running" || activeTab === "logs"
    const logsInterval = setInterval(loadLiveLogs, isFast ? 400 : 2500)
    return () => clearInterval(logsInterval)
  }, [loadLiveLogs, activeExperiment?.status, activeTab])

  // Baseline synthetic heartbeat: 1 request per second when traffic is idle to keep telemetry rings active
  useEffect(() => {
    if (activeExperiment?.status === "running") return

    // Initial heartbeat ping
    pingTestTarget().catch(() => {})

    const heartbeatInterval = setInterval(() => {
      pingTestTarget().catch(() => {})
    }, 1000)

    return () => clearInterval(heartbeatInterval)
  }, [activeExperiment?.status])

  // Active experiment tracking loop
  useEffect(() => {
    if (!activeExperiment || activeExperiment.status !== "running") return

    const pollInterval = setInterval(async () => {
      try {
        const updated = await getExperiment(activeExperiment.id)
        if (updated.status !== "running") {
          setSelectedExperiment(updated)
          setActiveExperiment(null)
          setCompletedExperiment(updated)
          setTimeout(() => {
            setCompletedExperiment((curr) => (curr?.id === updated.id ? null : curr))
          }, 6000)
          loadHistory()
          loadMetrics()
          showToast({
            type: updated.status === "completed" ? "success" : "info",
            title: updated.status === "completed" ? "Scenario completed" : `Scenario ${updated.status}`,
            description: `${updated.results.total_requests} reqs · ${updated.results.achieved_rps} RPS achieved`,
          })
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
  }, [activeExperiment, loadHistory, loadMetrics, appendLog, showToast])

  // Start experiment
  const handleStartExperiment = async (params: {
    scenario?: ScenarioType
    duration_seconds: number
    intensity: "low" | "moderate" | "high"
  }) => {
    setIsStarting(true)
    setErrorMessage(null)
    setCompletedExperiment(null)
    const targetScenario = params.scenario || "traffic_burst"
    const scenarioLabel = targetScenario.replaceAll("_", " ")

    showToast({
      type: "loading",
      title: "Launching scenario…",
      description: `${scenarioLabel} (${params.intensity}) · ${params.duration_seconds}s`,
    })

    try {
      const exp = await createExperiment({
        scenario: targetScenario,
        duration_seconds: params.duration_seconds,
        intensity: params.intensity,
      })
      setActiveExperiment(exp)
      setSelectedExperiment(null)
      showToast({
        type: "success",
        title: "Scenario in flight",
        description: `${scenarioLabel} moving traffic live`,
      })
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
      const msg = err?.message || "Failed to start experiment"
      setErrorMessage(msg)
      showToast({
        type: "error",
        title: "Scenario launch failed",
        description: msg,
      })
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
      showToast({
        type: "info",
        title: "Scenario stopped",
        description: `Captured ${stopped.results.total_requests} requests`,
      })
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
      showToast({
        type: "error",
        title: "Stop failed",
        description: err?.message || "Could not abort experiment",
      })
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
        handleTabChange(activeTab === "logs" ? "studio" : "logs")
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [isCommandMenuOpen, activeTab, handleTabChange])

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar
        activeTab={activeTab}
        archiveCount={experiments.length}
        isExperimentRunning={activeExperiment?.status === "running"}
        onChangeTab={handleTabChange}
        onRefresh={() => {
          checkHealth()
          loadMetrics()
          loadHistory()
          loadInfrastructure()
        }}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
      />

      <main className="mx-auto w-full max-w-[980px] flex-1 px-5 pb-20 pt-16 sm:pt-20">
        {/* TAB BODIES */}
        <div className="min-h-[480px]">
          {/* TAB 1: RELIABILITY STUDIO */}
          {activeTab === "studio" && (
            <div className="flex flex-col gap-4">
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

              {/* Results Summary Card with Smooth Spring Expansion */}
              <AnimatePresence>
                {(selectedExperiment || (activeExperiment && activeExperiment.status !== "running")) && (
                  <motion.div
                    ref={resultsCardRef}
                    initial={{ opacity: 0, height: 0, y: -16 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -16 }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    className="overflow-hidden"
                  >
                    <ExperimentResultsCard
                      experiment={selectedExperiment || activeExperiment}
                      onClose={() => setSelectedExperiment(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Compact Recent History Preview */}
              <div className="rounded-[28px] bg-white px-8 py-8 sm:px-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-baseline justify-between">
                  <div
                    onClick={() => {
                      if (selectedExperiment) {
                        setSelectedExperiment(null)
                      } else if (experiments.length > 0) {
                        setSelectedExperiment(experiments[0])
                        setTimeout(() => {
                          resultsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                        }, 100)
                      }
                    }}
                    className="group flex items-center gap-2.5 cursor-pointer select-none"
                    title="Click to toggle expanded results view"
                  >
                    <h3 className="text-[21px] font-semibold tracking-[-0.03em] group-hover:text-[#0071e3] transition-colors">
                      Recent runs
                    </h3>
                    <span className="text-[11.5px] font-medium text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full transition-transform group-hover:scale-105">
                      {selectedExperiment ? "Collapse" : "Click to expand view"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("history")}
                    className="text-[17px] text-[#0066cc] hover:underline"
                  >
                    See all ›
                  </button>
                </div>
                <ExperimentHistoryTable
                  embedded
                  experiments={experiments.slice(0, 5)}
                  selectedExperimentId={selectedExperiment?.id || activeExperiment?.id || null}
                  onSelectExperiment={(exp) => {
                    setSelectedExperiment(exp)
                    setTimeout(() => {
                      resultsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                    }, 100)
                  }}
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

          {/* TAB 3: DEDICATED REQUEST LOGS CONSOLE */}
          {activeTab === "logs" && (
            <LiveLogsViewer
              logs={logs}
              onClearLogs={handleClearLogs}
              onProbeTarget={handlePingTarget}
              onNavigateToTraces={() => {
                handleTabChange("traces")
              }}
              isExperimentRunning={activeExperiment?.status === "running"}
            />
          )}

          {/* TAB 4: EXPERIMENT HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <ExperimentHistoryTable
                experiments={experiments}
                selectedExperimentId={inspectingExperiment?.id || null}
                onSelectExperiment={(exp) => setInspectingExperiment(exp)}
                onRefresh={loadHistory}
                isLoading={isHistoryLoading}
              />
              <ExperimentDetailModal
                experiment={inspectingExperiment}
                onClose={() => setInspectingExperiment(null)}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="mx-auto flex max-w-[980px] items-center justify-between px-6 pb-10 text-[12px] text-[#6e6e73]">
        <p>SimianX · Cloud resilience</p>
        <p>OpenTelemetry · Kubernetes</p>
      </footer>

      {/* Floating Simulation In-Progress Float Screen */}
      <FloatingScenarioHUD
        activeExperiment={activeExperiment}
        isStarting={isStarting}
        isStopping={isStopping}
        onStop={handleStopExperiment}
        metrics={metrics}
        infraData={infraData}
        completedExperiment={completedExperiment}
        onDismissCompleted={() => setCompletedExperiment(null)}
      />

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
        onOpenLogs={() => handleTabChange("logs")}
        onPingTarget={handlePingTarget}
      />
    </div>
  )
}

export default App
