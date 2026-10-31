import React, { useState } from "react"
import type { InfrastructureData } from "../types/infrastructure"

interface InfrastructurePanelProps {
  data: InfrastructureData | null
  onScale: (replicas: number) => Promise<void>
}

export const InfrastructurePanel: React.FC<InfrastructurePanelProps> = ({ data, onScale }) => {
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
      setScaleMessage(`Scaled to ${replicas} replicas.`)
      setTimeout(() => setScaleMessage(null), 4000)
    } catch (err: any) {
      setScaleMessage(`Scaling failed: ${err.message}`)
    } finally {
      setIsScaling(false)
    }
  }

  const cliCommand = `kubectl scale deployment ${data?.deployment_name || "scalekart-backend"} --replicas=${targetReplicas} -n ${data?.namespace || "simianx"}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cliCommand)
    setCopiedCli(true)
    setTimeout(() => setCopiedCli(false), 2000)
  }

  if (!data) {
    return (
      <div className="rounded-[28px] bg-white px-6 py-10 text-center text-[15px] text-[#6e6e73]">
        Loading cluster topology…
      </div>
    )
  }

  const desired = data.desired_replicas
  const ready = data.ready_replicas
  const pods = data.pods || []
  const prom = data.prometheus
  const compute = data.compute
  const totalRestarts = pods.reduce((acc, p) => acc + (p.restarts || 0), 0)

  const stats = [
    ["Fleet", `${ready}/${desired}`, totalRestarts === 0 ? "No restarts" : `${totalRestarts} restarts`],
    ["Memory", compute?.total_memory_mb ? compute.total_memory_mb.toFixed(1) : "—", "MB allocated"],
    ["Prometheus", String(prom?.healthy_targets_count ?? 0), prom?.connected ? "Connected" : "Standby"],
    ["GitOps", "Synced", "Argo CD"],
  ]

  return (
    <section className="overflow-hidden rounded-[28px] bg-white">
      <div className="flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <div>
          <h2 className="text-[32px] font-semibold tracking-[-0.035em] sm:text-[40px]">
            {ready}/{desired}
          </h2>
          <p className="mt-1 text-[17px] text-[#6e6e73]">
            pods ready in {data.namespace || "simianx"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-full bg-[#f5f5f7] p-1 text-[14px]">
            {[1, 2, 4, 6, 8].map((count) => (
              <button
                key={count}
                disabled={isScaling}
                onClick={() => handleScale(count)}
                className={`rounded-full px-3.5 py-1.5 ${
                  desired === count ? "bg-white font-medium text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"
                } disabled:opacity-50`}
              >
                {count}
              </button>
            ))}
          </div>
          <button onClick={copyToClipboard} className="text-[15px] text-[#0066cc] hover:underline">
            {copiedCli ? "Copied" : "Copy command"}
          </button>
        </div>
      </div>

      {scaleMessage && (
        <p className={`px-6 pb-2 text-[15px] sm:px-8 ${scaleMessage.includes("failed") ? "text-[#ff3b30]" : "text-[#0066cc]"}`}>
          {scaleMessage}
        </p>
      )}

      <div className="grid grid-cols-2 gap-px bg-black/[0.08] sm:grid-cols-4">
        {stats.map(([label, value, note]) => (
          <div key={label} className="bg-white px-4 py-10 text-center">
            <p className="text-[28px] font-semibold leading-none tracking-[-0.04em] sm:text-[32px]">{value}</p>
            <p className="mt-2 text-[14px] text-[#1d1d1f]">{label}</p>
            <p className="mt-0.5 text-[12px] text-[#86868b]">{note}</p>
          </div>
        ))}
      </div>

      {pods.length > 0 && (
        <div className="grid gap-px bg-black/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          {pods.map((pod) => (
            <div key={pod.name} className="bg-[#f5f5f7] px-6 py-5">
              <p className="truncate text-[15px] font-medium tracking-[-0.01em]">{pod.name.split("-").slice(-2).join("-")}</p>
              <p className="mt-1 text-[13px] text-[#6e6e73]">
                {pod.ready ? "Ready" : pod.phase}
                <span className="mx-1.5 text-[#d2d2d7]">·</span>
                {pod.restarts} restarts
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default InfrastructurePanel
