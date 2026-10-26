import React, { useState } from "react"
import { Activity, Check, Copy, Cpu, HardDrive, RefreshCw, Server, Zap } from "lucide-react"
import type { InfrastructureData } from "../types/infrastructure"

interface InfrastructurePanelProps {
  data: InfrastructureData | null
  onScale: (replicas: number) => Promise<void>
}

export const InfrastructurePanel: React.FC<InfrastructurePanelProps> = ({
  data,
  onScale,
}) => {
  const [targetReplicas, setTargetReplicas] = useState<number>(data?.desired_replicas || 4)
  const [isScaling, setIsScaling] = useState<boolean>(false)
  const [scaleMessage, setScaleMessage] = useState<string | null>(null)
  const [copiedCli, setCopiedCli] = useState<boolean>(false)

  const handleScale = async (replicas: number) => {
    setTargetReplicas(replicas)
    setIsScaling(true)
    setScaleMessage(null)
    try {
      await onScale(replicas)
      setScaleMessage(`Scaled deployment to ${replicas} replicas.`)
      setTimeout(() => setScaleMessage(null), 4000)
    } catch (err: any) {
      setScaleMessage(`Scaling failed: ${err.message}`)
    } finally {
      setIsScaling(false)
    }
  }

  const cliCommand = `kubectl scale deployment ${data?.deployment_name || "simianx-backend"} --replicas=${targetReplicas} -n ${data?.namespace || "simianx-dev"}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cliCommand)
    setCopiedCli(true)
    setTimeout(() => setCopiedCli(false), 2000)
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 text-center font-mono text-xs text-slate-500 dark:border-neutral-800/80 dark:bg-neutral-950/80 dark:text-neutral-400">
        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-slate-400 dark:text-neutral-500 mb-2" />
        Connecting to Kubernetes cluster & Prometheus targets...
      </div>
    )
  }

  const desired = data.desired_replicas
  const ready = data.ready_replicas
  const pods = data.pods || []
  const prom = data.prometheus
  const storage = data.storage
  const compute = data.compute
  const totalRestarts = pods.reduce((acc, p) => acc + (p.restarts || 0), 0)

  const avgScrapeMs =
    prom?.targets && prom.targets.length > 0
      ? (
          prom.targets.reduce((acc, t) => acc + (t.scrape_duration_ms || 0), 0) /
          prom.targets.length
        ).toFixed(1)
      : "1.2"

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs dark:border-neutral-800/80 dark:bg-neutral-950/80 dark:shadow-md transition-all space-y-4">
      {/* 1. Header with Inline Pod Scaler */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-neutral-850 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Kubernetes Infrastructure
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-neutral-900 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800">
              {data.namespace || "simianx-dev"}
            </span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">
              • {ready}/{desired} Pods Ready
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
            Managed Deployment: <code className="text-slate-700 dark:text-neutral-300 font-mono text-xs">{data.deployment_name || "simianx-backend"}</code>
          </p>
        </div>

        {/* Inline Horizontal Pod Scaler */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400 font-medium">
            <span>Replicas:</span>
            {isScaling && <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 dark:border-neutral-800 dark:bg-neutral-900/60 text-xs">
            {[2, 4, 6, 8, 10].map((count) => {
              const isSelected = desired === count
              return (
                <button
                  key={count}
                  disabled={isScaling}
                  onClick={() => handleScale(count)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                  } ${isScaling ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {count}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {scaleMessage && (
        <div className={`rounded-md px-3 py-1.5 text-xs border ${
          scaleMessage.includes("failed")
            ? "border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-medium"
            : "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
        }`}>
          {scaleMessage}
        </div>
      )}

      {/* 2. Compact 4-Card Capacity & Health Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Metric 1: Pods Replicas */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/40 p-3 dark:border-neutral-800/80 dark:bg-neutral-900/30">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Server className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              <span>Replicas</span>
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {ready === desired ? "Synchronized" : "Rolling"}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{ready}</span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">/ {desired} pods</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500 truncate">
            {totalRestarts === 0 ? "Zero Restarts" : `${totalRestarts} Restarts`} • Optimal
          </p>
        </div>

        {/* Metric 2: Fleet Memory */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/40 p-3 dark:border-neutral-800/80 dark:bg-neutral-900/30">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span>Memory (RSS)</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium tabular-nums">
              {compute?.memory_percent ?? 0}%
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {compute?.total_memory_mb ?? "0"}
            </span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">/ {compute?.memory_limit_mb ?? 256} MB</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(3, compute?.memory_percent ?? 0))}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Rootfs Storage */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/40 p-3 dark:border-neutral-800/80 dark:bg-neutral-900/30">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              <span>Storage (/)</span>
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
              {storage?.used_percent ?? 0}%
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {storage?.used_gb ?? "0.0"}
            </span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">/ {storage?.total_gb ?? "0.0"} GB</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(3, storage?.used_percent ?? 0))}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Prometheus Discovery */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/40 p-3 dark:border-neutral-800/80 dark:bg-neutral-900/30">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>Prometheus</span>
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {prom?.connected ? "Online" : "Offline"}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {prom?.healthy_targets_count ?? pods.length}
            </span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">/ {prom?.active_targets_count ?? pods.length} UP</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500 truncate">
            Scrape: {avgScrapeMs}ms • 2s Interval
          </p>
        </div>
      </div>

      {/* 3. Clean Pod Fleet Inventory */}
      <div>
        <div className="flex items-center justify-between pb-1.5 text-xs text-slate-500 dark:text-neutral-400">
          <span className="font-semibold text-slate-800 dark:text-neutral-200">
            Active Pod Fleet ({pods.length})
          </span>
          <span className="text-xs text-slate-400">
            In-cluster Pod Role Discovery
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-neutral-800/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-xs text-slate-500 dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:text-neutral-400">
                <th className="py-2.5 px-3.5 font-medium">Pod Name</th>
                <th className="py-2.5 px-3.5 font-medium">Status</th>
                <th className="py-2.5 px-3.5 font-medium">IP Address</th>
                <th className="py-2.5 px-3.5 font-medium">Memory (RSS)</th>
                <th className="py-2.5 px-3.5 font-medium">Restarts</th>
                <th className="py-2.5 px-3.5 font-medium">Scrape</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-850">
              {pods.map((pod, idx) => {
                const target = prom?.targets?.find(
                  (t) => t.pod_name === pod.name || t.instance.includes(pod.ip || "---")
                )
                return (
                  <tr
                    key={pod.name || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/40 transition-colors"
                  >
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <Server className="h-3 w-3 text-slate-400 dark:text-neutral-500 shrink-0" />
                        <span className="truncate max-w-[220px]" title={pod.name}>
                          {pod.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 dark:text-neutral-300">
                        <span className={`h-1.5 w-1.5 rounded-full ${pod.ready ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{pod.ready ? "1/1 Ready" : "0/1 Pending"}</span>
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 dark:text-neutral-400 text-[11px]">
                      {pod.ip || "—"}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-neutral-300 font-medium text-[11px]">
                      {pod.memory_mb ? `${pod.memory_mb} MB` : "—"}
                    </td>
                    <td className="py-2 px-3 text-slate-500 dark:text-neutral-400 text-[11px]">
                      {pod.restarts}
                    </td>
                    <td className="py-2 px-3">
                      {target ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            target.health === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          <Zap className="h-2.5 w-2.5" />
                          <span>UP ({target.scrape_duration_ms}ms)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500 text-[11px]">
                          Syncing
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Minimalist CLI Command Strip */}
      <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 dark:border-neutral-800/80 dark:bg-black/40 px-3 py-1.5 font-mono text-[11px] text-slate-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">$</span>
          <span className="truncate">{cliCommand}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200 ml-2 transition-colors shrink-0"
          title="Copy CLI command"
        >
          {copiedCli ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          <span>{copiedCli ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  )
}
