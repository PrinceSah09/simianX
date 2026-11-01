import React, { useId } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface AnimatedNumberProps {
  value: number | null | undefined
  decimals?: number
  prefix?: string
  suffix?: string
  fallback?: string
  className?: string
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

/**
 * DigitReel
 * Individual vertical tumbler digit reel modeled directly after
 * Apple's SwiftUI `.numericText()` content transition.
 * Only the digit that changes slides smoothly on its vertical rail.
 */
const DigitReel: React.FC<{ digit: number }> = ({ digit }) => {
  return (
    <span
      className="relative inline-flex h-[1em] overflow-hidden align-baseline tabular-nums leading-none select-none"
      aria-hidden="true"
    >
      {/* Invisible placeholder: guarantees exact font-size line-height & tabular character width */}
      <span className="invisible opacity-0 leading-none" aria-hidden="true">
        0
      </span>

      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col items-center leading-none pointer-events-none"
        initial={false}
        animate={{ y: `-${digit * 10}%` }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 26,
          mass: 0.55,
        }}
        aria-hidden="true"
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="flex h-[1em] w-full items-center justify-center leading-none tabular-nums"
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

/**
 * AnimatedNumber
 * Authentic Apple-style rolling numeric transition (SwiftUI .numericText()).
 * Each digit rotates independently on a vertical track with spring physics,
 * while non-changing digits and punctuation stay rock-solid.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  fallback = "—",
  className = "",
}) => {
  const instanceId = useId()

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return (
      <span className={`inline-flex items-baseline tabular-nums ${className}`}>
        {prefix}
        {fallback}
        {suffix}
      </span>
    )
  }

  const isNegative = value < 0
  const absValue = Math.abs(value)
  const formattedStr =
    decimals > 0 ? absValue.toFixed(decimals) : Math.round(absValue).toString()

  const [intPart, decPart] = formattedStr.split(".")
  const intChars = intPart.split("")
  const decChars = decPart ? decPart.split("") : []

  return (
    <span
      className={`inline-flex items-baseline tabular-nums leading-none ${className}`}
      aria-label={`${prefix}${isNegative ? "-" : ""}${formattedStr}${suffix}`}
    >
      {prefix && (
        <span className="inline-block leading-none select-none" aria-hidden="true">
          {prefix}
        </span>
      )}

      {isNegative && (
        <span className="inline-block leading-none select-none" aria-hidden="true">
          -
        </span>
      )}

      {/* Integer digits with place-value keying (ones, tens, hundreds) */}
      <AnimatePresence initial={false} mode="popLayout">
        {intChars.map((char, index) => {
          const place = intChars.length - 1 - index
          const digit = parseInt(char, 10)

          if (isNaN(digit)) {
            return (
              <span
                key={`${instanceId}-int-sym-${index}`}
                className="inline-block leading-none select-none"
                aria-hidden="true"
              >
                {char}
              </span>
            )
          }

          return (
            <motion.span
              key={`${instanceId}-int-${place}`}
              initial={{ opacity: 0, scale: 0.85, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex leading-none"
            >
              <DigitReel digit={digit} />
            </motion.span>
          )
        })}
      </AnimatePresence>

      {/* Decimal separator and decimal places */}
      {decimals > 0 && decPart !== undefined && (
        <>
          <span
            className="inline-block leading-none select-none"
            aria-hidden="true"
          >
            .
          </span>
          {decChars.map((char, index) => {
            const digit = parseInt(char, 10)
            if (isNaN(digit)) {
              return (
                <span
                  key={`${instanceId}-dec-sym-${index}`}
                  className="inline-block leading-none select-none"
                  aria-hidden="true"
                >
                  {char}
                </span>
              )
            }

            return (
              <span
                key={`${instanceId}-dec-${index}`}
                className="inline-flex leading-none"
              >
                <DigitReel digit={digit} />
              </span>
            )
          })}
        </>
      )}

      {suffix && (
        <span className="inline-block leading-none select-none" aria-hidden="true">
          {suffix}
        </span>
      )}
    </span>
  )
}

export default AnimatedNumber
