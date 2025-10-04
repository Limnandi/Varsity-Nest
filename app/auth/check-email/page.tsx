"use client"

import { useState, useEffect } from "react"
import { useUser } from "@stackframe/stack"
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  const user = useUser()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  // Check if user is already verified
  useEffect(() => {
    if (user?.primaryEmailVerified) {
      // Redirect to login page with success message
      const redirectUrl = "/auth/login?verified=true"
      window.location.href = redirectUrl
    }
  }, [user])

  const handleResendVerification = async () => {
    if (!user) return

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      // Get user's contact channels
      const contactChannels = await user.listContactChannels()
      const emailChannel = contactChannels.find(
        channel => channel.type === 'email' && channel.value === user.primaryEmail
      )

      if (emailChannel) {
        await emailChannel.sendVerificationEmail()
        setResendSuccess(true)
      } else {
        setResendError("Email channel not found. Please contact support.")
      }
    } catch (error: any) {
      console.error("Failed to resend verification email:", error)
      setResendError(error.message || "Failed to resend verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white w-full max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">Access Required</h1>
            <p className="text-neutral-300 text-lg mb-8">Please sign in to access this page.</p>
            <Link href="/auth/login">
              <button className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]">
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4">
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-20 h-20 border border-blue-500/50 bg-blue-500/10 rounded-full flex items-center justify-center shadow-[0_0_20px_theme(colors.blue.500/40%)]">
            <Mail className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">Check Your Email</h1>
          <p className="text-neutral-300 text-lg">
            We&apos;ve sent a verification link to <strong className="text-blue-400">{user.primaryEmail}</strong>
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="text-center text-sm text-neutral-400">
            <p>Click the link in your email to verify your account and complete your registration.</p>
            <p className="mt-2">The link will expire in 24 hours.</p>
          </div>

          {resendSuccess && (
            <div className="flex items-center space-x-3 p-4 border border-green-500/50 bg-green-500/10 backdrop-blur-xl rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-300 text-sm">Verification email sent successfully!</span>
            </div>
          )}

          {resendError && (
            <div className="flex items-center space-x-3 p-4 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl">
              <span className="text-red-300 text-sm">{resendError}</span>
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleResendVerification}
              disabled={isResending}
              className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              <span className="relative z-10 flex items-center">
                {isResending ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <Link href="/auth/login">
              <button className="group relative w-full border border-white/20 bg-black/20 backdrop-blur-xl text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
                <span className="relative z-10 flex items-center">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Sign In
                </span>
              </button>
            </Link>
          </div>

          <div className="text-center text-xs text-neutral-500">
            <p>Didn&apos;t receive the email? Check your spam folder or contact support.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
