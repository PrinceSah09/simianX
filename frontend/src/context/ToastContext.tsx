import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Loader2, Terminal } from "lucide-react"

export interface ToastOptions {
  type: "success" | "error" | "loading" | "info"
  title: string
  description?: string
  durationMs?: number
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback((opts: ToastOptions) => {
    // Clear any previous active timer to ensure rock-solid timing
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    setToast(opts)

    // Dynamic auto-dismiss: 3.5s standard, 8s safety fallback for loading
    const duration = opts.durationMs || (opts.type === "loading" ? 8000 : 3500)
    timerRef.current = setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, duration)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Floating Apple Dynamic Island Toast */}
      <div className="fixed top-16 sm:top-20 inset-x-0 z-[100] flex justify-center pointer-events-none px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              layout
              initial={{ y: -28, opacity: 0, scale: 0.88 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.9 }}
              transition={{
                layout: { type: "spring", stiffness: 450, damping: 30 },
                opacity: { duration: 0.18 },
                y: { type: "spring", stiffness: 450, damping: 28 },
                scale: { type: "spring", stiffness: 450, damping: 28 },
              }}
              onClick={hideToast}
              style={{
                backgroundColor: "rgba(29, 29, 31, 0.95)",
                color: "#ffffff",
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.12)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
              className="pointer-events-auto flex h-10 max-w-[460px] cursor-pointer items-center gap-2.5 rounded-full px-4 border border-white/20 active:scale-95 transition-transform select-none"
            >
              {/* Status Icons with Micro-Animation */}
              <motion.div
                key={toast.type}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="flex shrink-0 items-center justify-center"
              >
                {toast.type === "loading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#2997ff]" />
                )}
                {toast.type === "success" && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#34c759]/25">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#30d158]" />
                  </div>
                )}
                {toast.type === "error" && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff453a]/25">
                    <AlertCircle className="h-3.5 w-3.5 text-[#ff453a]" />
                  </div>
                )}
                {toast.type === "info" && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2997ff]/25">
                    <Terminal className="h-3.5 w-3.5 text-[#2997ff]" />
                  </div>
                )}
              </motion.div>

              {/* Toast Text with explicit high-contrast white styling */}
              <motion.div
                key={toast.title + (toast.description || "")}
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5 min-w-0"
              >
                <span
                  style={{ color: "#ffffff", fontWeight: 600 }}
                  className="text-[13px] tracking-[-0.01em] whitespace-nowrap"
                >
                  {toast.title}
                </span>
                {toast.description && (
                  <span
                    style={{ color: "rgba(255, 255, 255, 0.75)" }}
                    className="text-[12px] font-normal truncate"
                  >
                    · {toast.description}
                  </span>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}
