import React from "react"

interface SimianXLogoProps {
  className?: string
  height?: number
  showBadge?: boolean
}

export const SimianXLogo: React.FC<SimianXLogoProps> = ({
  className = "",
  height = 22,
  showBadge = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="flex items-center">
        <img
          src="/simianx-logo.png"
          alt="SimianX"
          style={{ height: `${height}px`, width: "auto" }}
          className="object-contain block brightness-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]"
        />
      </div>

      {showBadge && (
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-mono font-medium text-zinc-300 border border-white/[0.08] backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Control Plane
        </span>
      )}
    </div>
  )
}

export default SimianXLogo
