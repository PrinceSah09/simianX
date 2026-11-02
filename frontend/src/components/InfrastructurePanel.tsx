import React, { useState } from "react"
import { motion } from "framer-motion"
import { Check, Terminal } from "lucide-react"
import { AnimatedNumber } from "./AnimatedNumber"
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

  const cliCommand = `kubectl scale deployment ${data?.deployment_name || "simianx-backend"} --replicas=${targetReplicas} -n ${data?.namespace || "simianx"}`

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

  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Top Header & Replicas Segmented Control */}
      <div className="flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <div>
          <h2 className="flex items-baseline text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f] sm:text-[40px]">
            <AnimatedNumber value={ready} />
            <span className="mx-1 font-light text-[#86868b]/40">/</span>
            <AnimatedNumber value={desired} />
          </h2>
          <p className="mt-1 text-[17px] text-[#6e6e73]">
            pods ready in {data.namespace || "simianx"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tactile Apple Copy Command Pill - Matched h-9 height & rock-solid fixed width */}
          <button
            onClick={copyToClipboard}
            type="button"
            title={`Copy: ${cliCommand}`}
            className={`h-9 w-[138px] shrink-0 justify-center inline-flex items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-all duration-200 active:scale-[0.97] ${
              copiedCli
                ? "bg-[#34c759]/15 text-[#28a745]"
                : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-black/[0.08]"
            }`}
          >
            {copiedCli ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#28a745] shrink-0" />
                <span>Copied kubectl</span>
              </>
            ) : (
              <>
                <Terminal className="h-3.5 w-3.5 text-[#6e6e73] shrink-0" />
                <span>Copy kubectl</span>
              </>
            )}
          </button>

          {/* Apple Sliding Segmented Control - Matched h-9 height */}
          <div className="flex h-9 items-center rounded-full bg-[#f5f5f7] p-1 text-[13px]">
            {[1, 2, 4, 6, 8].map((count) => {
              const isSelected = desired === count

              return (
                <button
                  key={count}
                  type="button"
                  disabled={isScaling}
                  onClick={() => handleScale(count)}
                  className={`relative flex h-7 items-center justify-center rounded-full px-3 font-medium transition-colors ${
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
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-black/[0.06] sm:grid-cols-4">
        <div className="bg-white px-4 py-8 text-center">
          <p className="flex items-baseline justify-center text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#1d1d1f] sm:text-[32px]">
            <AnimatedNumber value={ready} />
            <span className="mx-0.5 font-light text-[#86868b]/40">/</span>
            <AnimatedNumber value={desired} />
          </p>
          <p className="mt-2 text-[14px] text-[#1d1d1f]">Fleet</p>
          <p className="mt-0.5 text-[12px] text-[#86868b]">
            {totalRestarts === 0 ? "No restarts" : `${totalRestarts} restarts`}
          </p>
        </div>

        <div className="bg-white px-4 py-8 text-center">
          <p className="flex items-baseline justify-center text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#1d1d1f] sm:text-[32px]">
            <AnimatedNumber
              value={compute?.total_memory_mb ?? 0}
              decimals={1}
              fallback="—"
            />
            <span className="ml-1 text-[16px] font-normal text-[#86868b]">MB</span>
          </p>
          <p className="mt-2 text-[14px] text-[#1d1d1f]">Memory</p>
          <p className="mt-0.5 text-[12px] text-[#86868b]">Allocated pool</p>
        </div>

        <div className="bg-white px-4 py-8 text-center">
          <p className="flex items-baseline justify-center text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#1d1d1f] sm:text-[32px]">
            <AnimatedNumber
              value={prom?.healthy_targets_count ?? 0}
              decimals={0}
            />
            <span className="ml-1 text-[16px] font-normal text-[#86868b]">
              {(prom?.healthy_targets_count ?? 0) === 1 ? "target" : "targets"}
            </span>
          </p>
          <p className="mt-2 text-[14px] text-[#1d1d1f]">Prometheus</p>
          <p className="mt-0.5 text-[12px] text-[#86868b]">
            {prom?.connected ? "Connected" : "Standby"}
          </p>
        </div>

        <div className="bg-white px-4 py-8 text-center">
          <p className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#1d1d1f] sm:text-[32px]">
            Synced
          </p>
          <p className="mt-2 text-[14px] text-[#1d1d1f]">App of Apps</p>
          <p className="mt-0.5 text-[12px] text-[#86868b]">Argo CD GitOps</p>
        </div>
      </div>

      {/* Live Pods Fleet Grid */}
      <div className="border-t border-black/[0.06] bg-white px-6 py-6 sm:px-10 sm:py-7">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">
              Pod Fleet
            </h3>
            <span className="rounded-full bg-black/[0.05] px-2.5 py-0.5 text-[11.5px] font-medium tabular-nums text-[#6e6e73]">
              {pods.length}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 text-[12.5px] text-[#6e6e73]">
            <span className="h-2 w-2 rounded-full bg-[#30d158]" />
            <span className="font-medium text-[#1d1d1f]">
              {ready === desired ? `${ready} ready` : `${ready} of ${desired} ready`}
            </span>
            <span className="text-black/20">·</span>
            <span>{data.namespace || "simianx"}</span>
          </div>
        </div>

        {pods.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-black/[0.08] bg-[#fbfbfd] py-10 text-center">
            <p className="text-[14px] text-[#6e6e73]">No running pod instances discovered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
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

                const memMb = pod.memory_mb || 0

                return (
                  <div
                    key={pod.name}
                    className="group flex flex-col justify-between rounded-[16px] border border-black/[0.06] bg-[#fbfbfd] p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:bg-white hover:border-black/[0.12] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                  >
                    {/* Top Row: Identity on Left + Memory Pill on Right */}
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isReady
                              ? "bg-[#30d158]"
                              : isStarting
                              ? "bg-[#ff9f0a] animate-pulse"
                              : "bg-[#ff3b30]"
                          }`}
                          title={statusLabel}
                        />
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#1d1d1f] leading-snug">
                            {friendlyName}
                          </p>
                          <p className="text-[11px] text-[#86868b] tracking-tight truncate leading-tight">
                            {pod.ip || "10.244.x.x"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 ml-2">
                        {pod.restarts > 0 && (
                          <span className="rounded-full bg-[#ff9f0a]/10 px-1.5 py-0.5 text-[10.5px] font-medium text-[#d97706]" title={`${pod.restarts} restarts`}>
                            {pod.restarts}r
                          </span>
                        )}
                        <span className="inline-block rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11.5px] font-medium tabular-nums text-[#1d1d1f]">
                          <AnimatedNumber value={memMb} decimals={0} suffix=" MB" />
                        </span>
                      </div>
                    </div>

                    {/* Apple Mini Memory / Storage Bar with Border */}
                    <div className="mt-2.5 h-1.5 w-full rounded-full border border-black/[0.06] bg-black/[0.03] p-[1px] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0071e3] transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, Math.max(8, Math.round((memMb / 128) * 100)))}%` }}
                      />
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
