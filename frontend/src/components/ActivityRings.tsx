import React from "react"
import { motion } from "framer-motion"

export interface RingSpec {
  value: number
  max: number
  color: string
}

interface ActivityRingsProps {
  rings: RingSpec[]
  size?: number
  stroke?: number
  gap?: number
  center?: React.ReactNode
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({
  rings,
  size = 196,
  stroke = 14,
  gap = 7,
  center,
}) => {
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {rings.map((ring, index) => {
          const radius = size / 2 - stroke / 2 - index * (stroke + gap)
          const circumference = 2 * Math.PI * radius
          const ratio = ring.max > 0 ? Math.max(0, Math.min(1, ring.value / ring.max)) : 0
          const offset = circumference * (1 - ratio)
          return (
            <g key={index}>
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="#e8e8ed"
                strokeWidth={stroke}
              />
              <motion.circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
              />
            </g>
          )
        })}
      </svg>
      {center && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
          {center}
        </div>
      )}
    </div>
  )
}

interface DonutProps {
  value: number
  max: number
  color: string
  size?: number
  stroke?: number
  label: string
  display: string
  unit: string
  caption?: string
}

export const Donut: React.FC<DonutProps> = ({
  value,
  max,
  color,
  size = 112,
  stroke = 9,
  label,
  display,
  unit,
  caption,
}) => {
  return (
    <div className="flex flex-col items-center bg-white px-4 py-9 sm:py-10">
      <ActivityRings
        rings={[{ value, max, color }]}
        size={size}
        stroke={stroke}
        center={
          <div>
            <p className="text-[22px] font-semibold leading-none tracking-[-0.04em] text-[#1d1d1f] tabular-nums">
              {display}
            </p>
            <p className="mt-1 text-[11px] text-[#86868b]">{unit}</p>
          </div>
        }
      />
      <p className="mt-4 text-[15px] font-medium tracking-[-0.01em] text-[#1d1d1f]">{label}</p>
      {caption && <p className="mt-0.5 text-[12px] text-[#86868b]">{caption}</p>}
    </div>
  )
}
