import React, { useState } from "react"
import { motion } from "framer-motion"
import { Check, Terminal } from "lucide-react"
import { useToast } from "../context/ToastContext"
import type { InfrastructureData } from "../types/infrastructure"

interface InfrastructurePanelProps {
  data: InfrastructureData | null
  onScale: (replicas: number) => Promise<void>
}

export const InfrastructurePanel: React.FC<InfrastructurePanelProps> = ({ data, onScale }) => {
  const [targetReplicas, setTargetReplicas] = useState<number>(data?.desired_replicas || 2)
  const [isScaling, setIsScaling] = useState<boolean>(false)
  const [copiedCli, setCopiedCli] = useState<boolean>(false)
  const { showToast } = useToast()

  const handleScale = async (replicas: number) => {
    setTargetReplicas(replicas)
    setIsScaling(true)

    showToast({
      type: "loading",
      title: "Scaling deployment…",
      description: `Targeting ${replicas} pods in ${data?.namespace || "simianx"}`,
    })

    try {
      await onScale(replicas)
      showToast({
        type: "success",
        title: `Deployment scaled`,
        description: `Target updated to ${replicas} replicas`,
      })
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Scaling failed",
        description: err.message || "Failed to scale deployment",
      })
    } finally {
      setIsScaling(false)
    }
  }

  const cliCommand = `kubectl scale deployment ${data?.deployment_name || "scalekart-backend"} --replicas=${targetReplicas} -n ${data?.namespace || "simianx"}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cliCommand)
    setCopiedCli(true)
    showToast({
      type: "info",
      title: "kubectl command copied",
      description: `Target ${targetReplicas} replicas ready to paste`,
    })
    setTimeout(() => setCopiedCli(false), 2200)
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
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Top Header & Replicas Segmented Control */}
      <div className="flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <div>
          <h2 className="text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f] sm:text-[40px]">
            {ready}/{desired}
          </h2>
          <p className="mt-1 text-[17px] text-[#6e6e73]">
            pods ready in {data.namespace || "simianx"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Apple Sliding Segmented Control */}
          <div className="flex items-center rounded-full bg-[#f5f5f7] p-1 text-[13px]">
            {[1, 2, 4, 6, 8].map((count) => {
              const isSelected = desired === count

              return (
                <button
                  key={count}
                  type="button"
                  disabled={isScaling}
                  onClick={() => handleScale(count)}
                  className={`relative rounded-full px-3 py-1 font-medium transition-colors ${
                    isSelected ? "text-[#1d1d1f]" : "text-[#6e6e73] hover:text-[#1d1d1f]"
                  } disabled:opacity-50`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeReplicaPill"
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Tactile Apple Copy Command Pill */}
          <button
            onClick={copyToClipboard}
            type="button"
            title={`Copy: ${cliCommand}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200 active:scale-[0.97] ${
              copiedCli
                ? "bg-[#34c759]/10 text-[#28a745]"
                : "bg-black/[0.04] text-[#1d1d1f]/80 hover:bg-black/[0.08] hover:text-[#1d1d1f]"
            }`}
          >
            {copiedCli ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#28a745]" />
                <span>Copied kubectl</span>
              </>
            ) : (
              <>
                <Terminal className="h-3.5 w-3.5 text-[#6e6e73]" />
                <span>Copy kubectl</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-black/[0.06] sm:grid-cols-4">
        {stats.map(([label, value, note]) => (
          <div key={label} className="bg-white px-4 py-8 text-center">
            <p className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#1d1d1f] sm:text-[32px]">
              {value}
            </p>
            <p className="mt-2 text-[14px] text-[#1d1d1f]">{label}</p>
            <p className="mt-0.5 text-[12px] text-[#86868b]">{note}</p>
          </div>
        ))}
      </div>

      {/* Live Pods Fleet Grid */}
      <div className="border-t border-black/[0.06] bg-[#fafafc] px-6 py-6 sm:px-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-[14px] font-medium text-[#1d1d1f]">
            Pod fleet
            <span className="ml-1.5 text-[13px] text-[#86868b]">
              ({pods.length})
            </span>
          </h3>
          <p className="text-[12px] text-[#86868b]">
            {ready === desired ? `${ready} ready` : `${ready} of ${desired} ready`} in {data.namespace || "simianx"}
          </p>
        </div>

        {pods.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-black/[0.08] bg-white py-8 text-center">
            <p className="text-[14px] text-[#6e6e73]">No running pod instances discovered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...pods]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((pod, idx) => {
                const friendlyName = `Pod ${String(idx + 1).padStart(2, "0")}`
                const isReady = pod.ready
                const isStarting =
                  !isReady &&
                  (pod.phase === "Running" ||
                    pod.phase === "Pending" ||
                    pod.phase === "ContainerCreating")
                const statusLabel = isReady
                  ? "Ready"
                  : isStarting
                  ? "Starting"
                  : pod.phase || "Failed"

                return (
                  <div
                    key={pod.name}
                    title={`Name: ${pod.name}\nIP: ${pod.ip || "Pending"}\nStatus: ${statusLabel}\nMemory: ${pod.memory_mb || 0} MB\nRestarts: ${pod.restarts}`}
                    className="flex flex-col justify-between rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-black/[0.12] hover:shadow-sm"
                  >
                    {/* Top Row: Name on Left, Clean Status Indicator on Right */}
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
                        {friendlyName}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                          isReady
                            ? "text-[#28a745]"
                            : isStarting
                            ? "text-[#d97706]"
                            : "text-[#dc2626]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isReady
                              ? "bg-[#34c759]"
                              : isStarting
                              ? "bg-[#ff9f0a] animate-pulse"
                              : "bg-[#ff3b30]"
                          }`}
                        />
                        {statusLabel}
                      </span>
                    </div>

                    {/* Bottom Row: IP and Memory */}
                    <div className="mt-3 flex items-center justify-between text-[12px] text-[#86868b]">
                      <span className="font-mono text-[11.5px]">{pod.ip || "10.244.x.x"}</span>
                      {pod.memory_mb ? (
                        <span className="tabular-nums">{pod.memory_mb.toFixed(0)} MB</span>
                      ) : (
                        <span>{pod.restarts > 0 ? `${pod.restarts} restarts` : "0 restarts"}</span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </section>
  )
}

export default InfrastructurePanel
