"use client"

import { useEffect, useRef, useState } from "react"
import { X, AlertTriangle, Flag } from "lucide-react"
import { useModalA11y } from "@/hooks/useModalA11y"
import { createPortal } from "react-dom"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string, description: string) => Promise<void>
  itemType: "review" | "reply"
  itemAuthor: string
}

export default function ReportModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  itemType, 
  itemAuthor 
}: ReportModalProps) {
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const reportReasons = [
    { value: "spam", label: "Spam or misleading content" },
    { value: "inappropriate", label: "Inappropriate or offensive content" },
    { value: "fake", label: "Fake or fraudulent review" },
    { value: "harassment", label: "Harassment or bullying" },
    { value: "other", label: "Other violation" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return

    setIsSubmitting(true)
    try {
      await onSubmit(reason, description)
      handleClose()
    } catch (error) {
      console.error('Report submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason("")
    setDescription("")
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

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
        aria-label={`Report ${itemType}`}
        className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-red-500/20 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close report modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center">
            <Flag className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Report {itemType}</h2>
            <p className="text-sm text-neutral-400">Help us maintain quality content</p>
          </div>
        </div>

        <div className="mb-6 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
          <p className="text-sm text-neutral-300">
            <span className="font-medium">Reporting content by:</span> {itemAuthor}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              Why are you reporting this {itemType}? *
            </label>
            <div className="space-y-2">
              {reportReasons.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-red-500 bg-black/20 border-white/20 focus:ring-red-500 focus:ring-2"
                  />
                  <span className="ml-3 text-sm text-neutral-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional context that might help us understand the issue..."
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-neutral-400 mt-1">
              {description.length}/500 characters
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!reason || isSubmitting}
              className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
            
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-white/20 bg-black/20 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02]"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">Report Guidelines</p>
              <p className="text-xs text-yellow-200 mt-1">
                Reports are reviewed by our moderation team. False reports may result in account restrictions.
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