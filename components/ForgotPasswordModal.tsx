"use client"

import { useRef, useState } from "react"
import { X, Mail, Loader2, CheckCircle, AlertCircle, Lock } from "lucide-react"
import { useModalA11y } from "@/hooks/useModalA11y"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
}

export default function ForgotPasswordModal({ 
  isOpen, 
  onClose,
  initialEmail = ""
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        // For security reasons, don't reveal if user exists or not
        if (response.status === 404 || data.error?.includes('not found')) {
          setError('')
          setSuccess(true)
        } else {
          setError(data.error || 'Failed to send password reset email')
        }
      } else {
        setError('')
        setSuccess(true)
      }
    } catch (error: any) {
      console.error("Failed to send password reset email:", error)
      setError(error.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setEmail(initialEmail)
    setError(null)
    setSuccess(false)
    setIsSubmitting(false)
    onClose()
  }

  useModalA11y({ isOpen, containerRef: dialogRef, onClose: handleClose })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Reset password"
        className="relative w-full max-w-md bg-black/90 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors"
          disabled={isSubmitting}
          aria-label="Close password reset"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl w-fit mx-auto mb-4">
            <Lock className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
          <p className="text-neutral-300 text-sm">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 border border-green-500/50 bg-green-500/10 rounded-xl flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-300 text-sm font-medium mb-1">Password reset email sent!</p>
              <p className="text-green-300/80 text-xs">
                If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-password-email" className="block text-sm font-semibold text-neutral-200 mb-2.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                <input
                  id="forgot-password-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="you@varsitynest.space"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Success Actions */}
        {success && (
          <div className="pt-4">
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              Close
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500">
            Remember your password?{" "}
            <button
              onClick={handleClose}
              className="text-blue-400 hover:text-blue-300 transition-colors underline"
            >
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

