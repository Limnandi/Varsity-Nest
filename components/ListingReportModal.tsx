"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, Flag, X } from "lucide-react"
import { toast } from "sonner"
import { useModalA11y } from "@/hooks/useModalA11y"

type ListingReportReason = "location" | "images" | "pricing" | "owner" | "safety" | "other"

interface ListingReportModalProps {
  isOpen: boolean
  onClose: () => void
  accommodationId: string
  accommodationName: string
}

export default function ListingReportModal({
  isOpen,
  onClose,
  accommodationId,
  accommodationName,
}: ListingReportModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [reason, setReason] = useState<ListingReportReason | "">("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [reporterName, setReporterName] = useState("")
  const [reporterEmail, setReporterEmail] = useState("")
  const [reporterPhone, setReporterPhone] = useState("")

  const reasons = useMemo(
    () =>
      [
        { value: "location", label: "Location is misleading / incorrect" },
        { value: "images", label: "Images are misleading / not of the property" },
        { value: "pricing", label: "Pricing / fees are misleading" },
        { value: "owner", label: "Owner / provider information seems suspicious" },
        { value: "safety", label: "Safety concern / scam risk" },
        { value: "other", label: "Other" },
      ] as const,
    [],
  )

  const reset = () => {
    setStep(1)
    setReason("")
    setDescription("")
    setIsSubmitting(false)
    setReporterName("")
    setReporterEmail("")
    setReporterPhone("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const isValidEmail = (value: string) => {
    if (!value.trim()) return true
    // Lightweight validation; server also validates length and normalizes
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    if (!isValidEmail(reporterEmail)) {
      toast.error("Please enter a valid email address (or leave it blank).")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/accommodations/${encodeURIComponent(accommodationId)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason,
          description,
          reporter: {
            name: reporterName,
            email: reporterEmail,
            phone: reporterPhone,
          },
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const message = data?.error || "Failed to submit report. Please try again."
        toast.error(message)
        return
      }

      toast.success("Report submitted. Thanks for helping keep listings accurate.")
      handleClose()
    } catch (err) {
      console.error("Listing report submission failed:", err)
      toast.error("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  useModalA11y({ isOpen, containerRef: dialogRef, onClose: handleClose })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev || "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const stepTitles: Record<1 | 2 | 3 | 4, string> = {
    1: "What’s misleading?",
    2: "Add details (optional)",
    3: "Your details (optional)",
    4: "Review & submit",
  }

  const canContinue =
    step === 1 ? !!reason : step === 3 ? isValidEmail(reporterEmail) : true

  const goNext = () => {
    if (step === 1 && !reason) return
    if (step === 3 && !isValidEmail(reporterEmail)) {
      toast.error("Please enter a valid email address (or leave it blank).")
      return
    }
    setStep((prev) => (prev < 4 ? ((prev + 1) as any) : prev))
  }

  const goBack = () => setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev))

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
      aria-hidden={!isOpen}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Report listing"
        className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 sm:p-7 text-white shadow-2xl shadow-red-500/20 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close report listing modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center">
            <Flag className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Report listing</h2>
            <p className="text-sm text-neutral-400">Help us keep listings accurate and safe</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-300 font-medium">{stepTitles[step]}</p>
            <p className="text-xs text-neutral-400">
              Step {step} of 4
            </p>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mt-5">
            <div className="p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
              <p className="text-sm text-neutral-300">
                <span className="font-medium">Listing:</span> {accommodationName}
              </p>
              <p className="text-xs text-neutral-400 mt-1">ID: {accommodationId}</p>
            </div>
          </div>

          <div className="min-h-[220px]">
            {step === 1 ? (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  Choose one reason *
                </label>
                <div className="space-y-2">
                  {reasons.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center p-3 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="listing-report-reason"
                        value={opt.value}
                        checked={reason === opt.value}
                        onChange={(e) => setReason(e.target.value as ListingReportReason)}
                        className="w-4 h-4 text-red-500 bg-black/20 border-white/20 focus:ring-red-500 focus:ring-2"
                      />
                      <span className="ml-3 text-sm text-neutral-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {!reason ? (
                  <p className="text-xs text-neutral-400 mt-3">
                    You can keep it quick—just pick the closest match.
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Details (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any context (e.g., what’s incorrect, what you observed, links, dates)..."
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={5}
                  maxLength={1000}
                />
                <div className="text-xs text-neutral-400 mt-1">{description.length}/1000 characters</div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-4">
                <p className="text-sm font-medium text-white mb-3">Your details (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Name</label>
                    <input
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      maxLength={120}
                      placeholder="e.g., Jane Doe"
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Email</label>
                    <input
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      maxLength={254}
                      placeholder="you@example.com"
                      inputMode="email"
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {!isValidEmail(reporterEmail) ? (
                      <p className="text-xs text-red-300 mt-1">Please enter a valid email address.</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Phone</label>
                    <input
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      maxLength={50}
                      placeholder="+27 ..."
                      inputMode="tel"
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-3">
                  If you leave details, an admin may contact you for clarification.
                </p>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-3">
                <div className="border border-white/10 bg-black/20 rounded-xl p-4">
                  <p className="text-xs text-neutral-400">Reason</p>
                  <p className="text-sm text-white font-medium">
                    {reasons.find((r) => r.value === reason)?.label || reason}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/20 rounded-xl p-4">
                  <p className="text-xs text-neutral-400">Details</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{description.trim() || "—"}</p>
                </div>
                <div className="border border-white/10 bg-black/20 rounded-xl p-4">
                  <p className="text-xs text-neutral-400">Reporter (optional)</p>
                  <p className="text-sm text-white">{reporterName.trim() || "Anonymous"}</p>
                  <p className="text-xs text-neutral-300">{reporterEmail.trim() || "—"}</p>
                  <p className="text-xs text-neutral-300">{reporterPhone.trim() || "—"}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="px-5 py-3 border border-white/20 bg-black/20 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300"
              >
                Back
              </button>
            ) : null}

            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={!reason || isSubmitting}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                {isSubmitting ? "Submitting..." : "Submit report"}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-3 border border-white/20 bg-black/20 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">Report guidelines</p>
              <p className="text-xs text-yellow-200 mt-1">
                Reports are reviewed by our moderation team. Submitting false reports may result in restrictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}

