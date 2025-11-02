"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Lock, AlertCircle, Home, CheckCircle, KeyRound } from "lucide-react"

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const resetCode = searchParams.get('code')
    if (!resetCode) {
      setError("Invalid or missing reset code. Please request a new password reset link.")
    } else {
      setCode(resetCode)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code) {
      setError("Invalid reset code. Please request a new password reset link.")
      return
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsPending(true)
    setError("")

    try {
      // Call our API route which handles Stack Auth password reset
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          password: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to reset password. Please try again.")
        return
      }

      // Success
      setSuccess(true)
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?reset=success')
      }, 3000)

    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "An error occurred. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12 flex items-center justify-center">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/20 p-10 max-w-lg w-full">
          <Link 
            href="/" 
            className="absolute top-5 right-5 group p-2.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-lg hover:bg-white/5 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/20"
          >
            <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </Link>

          <div className="text-center">
            <div className="mx-auto mb-6 w-20 h-20 border border-green-500/50 bg-green-500/10 rounded-full flex items-center justify-center shadow-[0_0_20px_theme(colors.green.500/40%)]">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
              Password Reset Successful!
            </h1>
            <p className="text-neutral-300 text-base mt-1 mb-8">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
            <Link href="/auth/login">
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-6 rounded-xl font-semibold text-base hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
                Go to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12 flex items-center justify-center">
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/20 p-10 max-w-lg w-full">
        {/* Home Button */}
        <Link 
          href="/" 
          className="absolute top-5 right-5 group p-2.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-lg hover:bg-white/5 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/20"
        >
          <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        </Link>

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 w-20 h-20 border border-blue-500/50 bg-blue-500/10 rounded-full flex items-center justify-center shadow-[0_0_20px_theme(colors.blue.500/40%)]">
            <KeyRound className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Reset Password
          </h1>
          <p className="text-neutral-300 text-base mt-1">Enter your new password below</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-red-300 text-sm leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-200 mb-2.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending || !code}
                className="w-full pl-12 pr-14 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter new password (min. 8 characters)"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1 disabled:opacity-50"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending || !code}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-200 mb-2.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending || !code}
                className="w-full pl-12 pr-14 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1 disabled:opacity-50"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isPending || !code}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !code || !password || !confirmPassword}
            className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-6 rounded-xl font-semibold text-base hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span className="relative z-10 flex items-center justify-center">
              {isPending ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  <span>Resetting...</span>
                </>
              ) : (
                "Reset Password"
              )}
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Back to Login Link */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-center text-sm text-neutral-400">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

