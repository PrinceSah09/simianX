import React, { useState, useEffect } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { fetchAlertsStatus, updateAlertsConfig, sendTestSlackAlert, type SlackAlertsStatus } from "../services/api"
import { useToast } from "../context/ToastContext"

interface SlackAlertModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SlackAlertModal: React.FC<SlackAlertModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast()
  const [status, setStatus] = useState<SlackAlertsStatus | null>(null)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const loadStatus = async () => {
    try {
      const data = await fetchAlertsStatus()
      setStatus(data)
    } catch {
      // silent fallback
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadStatus()
      setTestResult(null)
      setWebhookUrl("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const isConfigured = Boolean(status?.configured || webhookUrl.trim())

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!webhookUrl.trim() && !status?.configured) return

    setIsSaving(true)
    try {
      const updated = await updateAlertsConfig({
        webhook_url: webhookUrl.trim() || undefined,
      })
      setStatus(updated)
      setWebhookUrl("")
      showToast({
        type: "success",
        title: "Settings saved",
        description: "Slack alert webhook updated successfully.",
      })
      onClose()
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed saving settings",
        description: err.message || "Could not save webhook.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await sendTestSlackAlert(webhookUrl.trim() || undefined)
      setTestResult({ success: true, message: res.message || "Test notification dispatched." })
      showToast({
        type: "success",
        title: "Notification dispatched",
        description: "Check your Slack channel for the SimianX test card.",
      })
      loadStatus()
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Test dispatch failed." })
      showToast({
        type: "error",
        title: "Test dispatch failed",
        description: err.message || "Could not reach Slack.",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.08] flex flex-col gap-5 text-[#1d1d1f] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
              Slack Alerts
            </h3>
            <p className="text-[12.5px] text-[#86868b] tracking-[-0.01em]">
              Instant notifications on error rate and latency spikes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.04] text-[#86868b] hover:bg-black/[0.08] hover:text-[#1d1d1f] transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Minimal Apple Status Row */}
        <div className="flex items-center justify-between rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-[12.5px]">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                status?.is_firing
                  ? "bg-[#ff3b30] animate-pulse"
                  : status?.configured
                  ? "bg-[#34c759]"
                  : "bg-[#86868b]/50"
              }`}
            />
            <span className="font-medium text-[#1d1d1f]">
              {status?.is_firing
                ? "Incident Active"
                : status?.configured
                ? "Connected"
                : "Not Configured"}
            </span>
          </div>

          <span className="font-mono text-[11.5px] text-[#86868b] truncate max-w-[190px]">
            {status?.webhook_masked || "No webhook URL"}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-medium tracking-tight text-[#86868b]">
              Incoming Webhook URL
            </label>
            <input
              type="url"
              placeholder={
                status?.configured
                  ? "Enter new URL to update"
                  : "https://hooks.slack.com/services/..."
              }
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-black/[0.08] bg-[#f9f9fb] px-3.5 py-2 font-mono text-[12.5px] text-[#1d1d1f] placeholder:text-[#86868b]/70 focus:border-[#0071e3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
            />
            <p className="text-[11.5px] text-[#86868b] tracking-[-0.01em]">
              Alerts trigger when error rate exceeds 5% or P95 exceeds 250ms.
            </p>
          </div>

          {/* Test status chip */}
          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] ${
                testResult.success
                  ? "bg-[#34c759]/10 text-[#248a3d]"
                  : "bg-[#ff3b30]/10 text-[#ff3b30]"
              }`}
            >
              {testResult.success ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{testResult.message}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !isConfigured}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] hover:bg-black/[0.08] active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {isTesting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{isTesting ? "Testing…" : "Send Test"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || (!webhookUrl.trim() && !status?.configured)}
                className="inline-flex items-center rounded-full bg-[#0071e3] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#0077ed] active:scale-[0.98] shadow-sm transition-all disabled:opacity-40"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SlackAlertModal
