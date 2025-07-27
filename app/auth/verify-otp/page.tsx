"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyOTP } from "@/lib/otp"
import { Lock, Mail, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 minutes
  const searchParams = useSearchParams()
  const router = useRouter()

  const email = searchParams.get("email")
  const userType = searchParams.get("userType") || "provider"
  const redirectPath = userType === "student" ? "/student/dashboard" : "/provider/dashboard"

  useEffect(() => {
    if (!email) {
      router.push("/")
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [email, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const result = await verifyOTP(email!, otp, "registration")
      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push(redirectPath), 2000)
      } else {
        setError(result.error || "Verification failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    try {
      const response = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userType })
      })
      const data = await response.json()
      if (!data.success) {
        setError(data.error || "Failed to resend OTP")
      } else {
        setCountdown(300)
      }
    } catch (err) {
      setError("Failed to resend OTP")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-blue-900 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Account</h1>
            <p className="text-gray-600">
              Enter the 6-digit code sent to <span className="font-medium">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">Verification successful! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  pattern="\d{6}"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="123456"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")} remaining
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Verifying...
                </div>
              ) : (
                "Verify Account"
              )}
            </button>

            {countdown === 0 && (
              <button
                type="button"
                onClick={handleResendOTP}
                className="w-full text-purple-600 hover:text-purple-700 text-sm font-medium mt-4"
              >
                Didn't receive code? Resend OTP
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}