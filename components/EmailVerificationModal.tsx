"use client"

import { useRef, useState } from "react"
import { X, Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useModalA11y } from "@/hooks/useModalA11y"

interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  userId: string
  firstName?: string
  lastName?: string
}

export default function EmailVerificationModal({ 
  isOpen, 
  onClose, 
  email, 
  userId, 
  firstName, 
  lastName 
}: EmailVerificationModalProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleResendVerification = async () => {
    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send verification email')
      }

      setResendSuccess(true)
    } catch (error: any) {
      console.error("Failed to resend verification email:", error)
      setResendError(error.message || "Failed to resend verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (!isOpen) return null

  useModalA11y({ isOpen, containerRef: dialogRef, onClose })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Email verification required"
        className="relative w-full max-w-md bg-black/90 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close verification modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="p-4 border border-orange-500/50 bg-orange-500/10 rounded-xl w-fit mx-auto mb-4">
            <Mail className="w-12 h-12 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verification Required</h2>
          <p className="text-neutral-300">
            {firstName && lastName 
              ? `Hi ${firstName} ${lastName}, `
              : "Hi there, "
            }
            please verify your email address to continue.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div className="p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl">
            <p className="text-blue-300 text-sm">
              We&apos;ve sent a verification link to <strong className="text-white">{email}</strong>
            </p>
          </div>

          <div className="text-center">
            <p className="text-neutral-400 text-sm mb-4">
              Check your inbox and click the verification link to activate your account.
            </p>
          </div>
        </div>

        {/* Resend section */}
        <div className="space-y-3">
          {resendSuccess && (
            <div className="p-3 border border-green-500/50 bg-green-500/10 rounded-xl flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">Verification email sent successfully!</span>
            </div>
          )}

          {resendError && (
            <div className="p-3 border border-red-500/50 bg-red-500/10 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">{resendError}</span>
            </div>
          )}

          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-blue-500/50 bg-blue-500/10 text-blue-300 rounded-xl hover:bg-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500">
            Didn&apos;t receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  )
}
