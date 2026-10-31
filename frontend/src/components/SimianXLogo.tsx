import React from "react"

interface SimianXLogoProps {
  className?: string
  height?: number
  showBadge?: boolean
}

export const SimianXLogo: React.FC<SimianXLogoProps> = ({ className = "" }) => {
  return (
    <span className={`text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f] ${className}`}>
      SimianX
    </span>
  )
}

export default SimianXLogo
