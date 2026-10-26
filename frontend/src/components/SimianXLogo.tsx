import React from "react"

interface SimianXLogoProps {
  className?: string
  height?: number
  showBadge?: boolean
}

export const SimianXLogo: React.FC<SimianXLogoProps> = ({
  className = "",
  height = 24,
  showBadge = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Exact SimianX Brand Logo Uploaded by User */}
      <div className="flex items-center overflow-hidden rounded bg-white px-1.5 py-0.5 shadow-sm border border-slate-200/80 dark:border-neutral-800">
        <img
          src="/simianx-logo.png"
          alt="SimianX"
          style={{ height: `${height}px`, width: "auto" }}
          className="object-contain block"
        />
      </div>

      {showBadge && (
        <span className="hidden sm:inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-orange-600 dark:text-orange-400 border border-orange-500/20">
          SRE Chaos
        </span>
      )}
    </div>
  )
}

export default SimianXLogo
