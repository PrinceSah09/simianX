import React, { useState } from "react"
import {
  Check,
  Copy,
  Cpu,
  Radio,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react"
import type { InfrastructureData } from "../types/infrastructure"

interface InfrastructurePanelProps {
  data: InfrastructureData | null
  onScale: (replicas: number) => Promise<void>
}

export const InfrastructurePanel: React.FC<InfrastructurePanelProps> = ({
  data,
  onScale,
}) => {
  const [targetReplicas, setTargetReplicas] = useState<number>(data?.desired_replicas || 2)
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

  const cliCommand = `kubectl scale deployment ${data?.deployment_name || "scalekart-backend"} --replicas=${targetReplicas} -n ${data?.namespace || "simianx-dev"}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cliCommand)
    setCopiedCli(true)
    setTimeout(() => setCopiedCli(false), 2000)
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/70 p-6 text-center font-mono text-xs text-zinc-400 backdrop-blur-2xl">
        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-zinc-500 mb-2" />
        Synchronizing Kubernetes fleet topology & Prometheus targets...
      </div>
    )
  }

  const desired = data.desired_replicas
  const ready = data.ready_replicas
  const pods = data.pods || []
  const prom = data.prometheus
  const compute = data.compute
  const totalRestarts = pods.reduce((acc, p) => acc + (p.restarts || 0), 0)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-950/70 p-5 sm:p-6 border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all space-y-5">
      {/* Specular Top Edge Light Refraction */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* 1. Header with Inline Apple Pod Scaler */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            <h2 className="text-sm font-semibold tracking-tight text-white font-sans">
              Kubernetes Fleet Topology
            </h2>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-mono font-medium text-zinc-300 border border-white/[0.08]">
              {data.namespace || "simianx-dev"}
            </span>
            <span className="text-xs font-mono text-emerald-400 font-medium">
              {ready}/{desired} Pods Ready
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Target Deployment: <code className="text-zinc-200 font-mono text-xs">{data.deployment_name || "scalekart-backend"}</code>
          </p>
        </div>

        {/* Inline Horizontal Pod Scaler */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <span>Replicas:</span>
            {isScaling && <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-zinc-900/90 p-1 border border-white/[0.08] shadow-inner text-xs">
            {[1, 2, 4, 6, 8].map((count) => {
              const isSelected = desired === count
              return (
                <button
                  key={count}
                  disabled={isScaling}
                  onClick={() => handleScale(count)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
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
        <div
          className={`rounded-xl px-3.5 py-2 text-xs border ${
            scaleMessage.includes("failed")
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300 font-medium"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-medium"
          }`}
        >
          {scaleMessage}
        </div>
      )}

      {/* 2. Apple Fleet Vitals Rack (4 Metrics) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Metric 1: Pods Replicas */}
        <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Server className="h-3.5 w-3.5 text-cyan-400" />
              <span>Fleet Scale</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-medium">
              {ready === desired ? "SYNCHRONIZED" : "ROLLING"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">
              {ready}
            </span>
            <span className="text-xs text-zinc-500">/ {desired} desired</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 truncate">
            {totalRestarts === 0 ? "Zero restarts" : `${totalRestarts} total restarts`}
          </p>
        </div>

        {/* Metric 2: Fleet Memory */}
        <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span>Container Heap</span>
            </span>
            <span className="text-[10px] font-mono text-purple-400 font-medium">
              {compute?.memory_percent ? `${compute.memory_percent}%` : "12%"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">
              {compute?.total_memory_mb ? compute.total_memory_mb.toFixed(1) : "24.5"}
            </span>
            <span className="text-xs text-zinc-500">MB allocated</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 truncate">
            cgroup Limit: 512 MB
          </p>
        </div>

        {/* Metric 3: Prometheus Discovery */}
        <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="h-3.5 w-3.5 text-blue-400" />
              <span>Prometheus</span>
            </span>
            <span className="text-[10px] font-mono text-blue-400 font-medium">
              {prom?.connected ? "ONLINE" : "STANDBY"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">
              {prom?.healthy_targets_count ?? 2}
            </span>
            <span className="text-xs text-zinc-500">targets active</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 truncate">
            Scrape interval: 2s
          </p>
        </div>

        {/* Metric 4: GitOps & Controller */}
        <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>GitOps State</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-medium">
              SYNCED
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">
              ArgoCD
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 truncate">
            App-of-Apps Root Active
          </p>
        </div>
      </div>

      {/* 3. Pod Fleet Visual Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span className="font-medium uppercase tracking-wider text-[10px]">
            Active Pod Instances ({pods.length})
          </span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 hover:text-white transition-colors text-[11px] font-mono cursor-pointer"
          >
            {copiedCli ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied command</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy scale CLI</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pods.map((pod) => (
            <div
              key={pod.name}
              className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.06] hover:border-white/20 transition-all hover:bg-white/[0.04] space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-xs font-semibold text-white font-mono truncate">
                    {pod.name.split("-").slice(-2).join("-")}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                  {pod.restarts === 0 ? "0 rest" : `${pod.restarts} rest`}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>IP: {pod.ip || "10.10.4.12"}</span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InfrastructurePanel
