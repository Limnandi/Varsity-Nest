"use client"

import type React from "react"
import { useState } from "react"
import { X, AlertTriangle, Flag, MessageSquare, Trash2, Ban } from "lucide-react"
import { StudentAuthService } from "@/lib/student-auth"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reviewId: number
  reviewAuthor: string
  reporterType: "student" | "provider"
  reporterName: string
  reporterId: string
}

const reportReasons = [
  { id: "inappropriate", label: "Inappropriate Language", icon: Ban },
  { id: "spam", label: "Spam or Fake Review", icon: Trash2 },
  { id: "harassment", label: "Harassment or Bullying", icon: AlertTriangle },
  { id: "false_info", label: "False Information", icon: Flag },
  { id: "personal_attack", label: "Personal Attack", icon: MessageSquare },
  { id: "other", label: "Other", icon: Flag },
]

export default function ReportModal({
  isOpen,
  onClose,
  reviewId,
  reviewAuthor,
  reporterType,
  reporterName,
  reporterId,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) return

    setIsSubmitting(true)

    try {
      // Submit the report
      StudentAuthService.submitReport(
        reviewId,
        reporterId,
        reporterType,
        reporterName,
        selectedReason,
        description || "No additional details provided",
      )

      setSubmitted(true)
      setTimeout(() => {
        onClose()
        resetForm()
      }, 2000)
    } catch (error) {
      console.error("Failed to submit report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedReason("")
    setDescription("")
    setSubmitted(false)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold">Report Review</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h3>
              <p className="text-gray-600">
                Thank you for helping keep our community safe. We&apos;ll review this report and take appropriate action.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Reporting review by:</strong> {reviewAuthor}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Reports are reviewed by our moderation team within 24 hours.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Why are you reporting this review?
                </label>
                <div className="space-y-2">
                  {reportReasons.map((reason) => {
                    const IconComponent = reason.icon
                    return (
                      <label
                        key={reason.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedReason === reason.id ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason.id}
                          checked={selectedReason === reason.id}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="sr-only"
                        />
                        <IconComponent className="w-4 h-4 text-gray-500 mr-3" />
                        <span className="text-sm font-medium text-gray-700">{reason.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Provide any additional context that might help our review..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Important</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      False reports may result in restrictions on your account. Only report content that genuinely
                      violates our community guidelines.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedReason || isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
