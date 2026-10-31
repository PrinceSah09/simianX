import React from "react"

interface AppleRingGaugeProps {
  label: string
  value: number | null
  unit: string
  max: number
  color: "cyan" | "purple" | "emerald" | "rose" | "amber"
  status?: "healthy" | "degraded" | "unhealthy" | "idle"
  subtitle?: string
  metaValues?: { label: string; value: string }[]
}

export const AppleRingGauge: React.FC<AppleRingGaugeProps> = ({
  label,
  value,
  unit,
  status = "healthy",
  subtitle,
}) => {
  const numVal = value ?? 0
  const shown = value === null ? "0" : Number.isInteger(numVal) ? String(numVal) : numVal.toFixed(1)
  const tone =
    status === "unhealthy" ? "text-[#ff3b30]" : status === "degraded" ? "text-[#b25000]" : "text-[#1d1d1f]"

  return (
    <div className="bg-white px-4 py-10 text-center sm:py-12">
      <p className={`text-[40px] font-semibold leading-none tracking-[-0.045em] tabular-nums sm:text-[48px] ${value === null ? "text-[#d2d2d7]" : tone}`}>
        {shown}
        <span className="ml-1 text-[15px] font-normal tracking-[-0.01em] text-[#6e6e73]">{unit}</span>
      </p>
      <p className="mt-2 text-[14px] text-[#1d1d1f]">{label}</p>
      {subtitle && <p className="mt-0.5 text-[12px] text-[#86868b]">{subtitle}</p>}
    </div>
  )
}
