"use client"

import type React from "react"

import { useState } from "react"
import { X, Mail, User, Shield, AlertCircle, Lock, Eye, EyeOff } from "lucide-react"
import { StudentAuthService } from "@/lib/student-auth"
import { useStackApp } from "@stackframe/stack"

interface StudentAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (student: any) => void
}

export default function StudentAuthModal({ isOpen, onClose, onSuccess }: StudentAuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
  const [step, setStep] = useState<"email" | "password" | "register" | "reset_password">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOTP] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const app = useStackApp()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (mode === "forgot") {
        // Delegate to StackAuth's built-in reset flow via login page
        window.location.href = "/auth/login?reset=1"
        return
      } else {
        // Login/Register flow
        const existingList = await StudentAuthService.getStudents()
        const existingStudent = existingList.find((s: any) => s.email === email)

        if (existingStudent) {
          if (mode === "register") {
            setError("An account with this email already exists. Please sign in instead.")
            return
          }
          // Go to password step for login
          setStep("password")
        } else {
          if (mode === "login") {
            setError("No account found with this email. Please register first.")
            return
          }
          // Proceed directly to registration step (StackAuth will send verification email after sign-up)
          setStep("register")
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await StudentAuthService.loginStudent(email, password)
      if (result.success && result.student) {
        onSuccess(result.student)
        onClose()
        resetForm()
      } else {
        setError(result.error!)
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // OTP step removed in favor of StackAuth's email verification

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      // Use StackAuth to sign up and trigger email verification
      const callbackBase = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      await app.signUpWithCredential({
        email,
        password,
        verificationCallbackUrl: `${callbackBase}/auth/check-email`
      })
      // Inform user to verify email
      alert("Account created. Please check your email to verify your account.")
      onClose()
      resetForm()
    } catch (err) {
      setError("Failed to register. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const success = await StudentAuthService.resetPassword(email, password)
      if (success) {
        alert("Password reset successfully! You can now sign in with your new password.")
        setMode("login")
        setStep("password")
        setPassword("")
        setConfirmPassword("")
      } else {
        setError("Failed to reset password. Please try again.")
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setMode("login")
    setStep("email")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setOTP("")
    setName("")
    setError("")
    setShowPassword(false)
    setShowConfirmPassword(false)
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
          <h2 className="text-xl font-bold">
            {mode === "login" ? "Student Sign In" : mode === "register" ? "Student Registration" : "Reset Password"}
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Email Step */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@ufs4life.ac.za"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Only @ufs4life.ac.za and @cut.ac.za emails are accepted</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? "Sending..." : mode === "forgot" ? "Send Reset Code" : "Continue"}
              </button>

              {mode !== "forgot" && (
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
                  </button>
                  <br />
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login")
                    setStep("email")
                  }}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm"
                >
                  Back to Sign In
                </button>
              )}
            </form>
          )}

          {/* Password Step */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Welcome back! Enter your password for <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email")
                    setPassword("")
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Use different email
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot")
                    setStep("email")
                    setPassword("")
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {/* OTP step removed; StackAuth sends verification email after sign-up */}

          {/* Register Step */}
          {step === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <User className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Complete Your Profile</h3>
                <p className="text-sm text-gray-600">Create your student account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {email}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Complete Registration"}
              </button>
            </form>
          )}

          {/* Reset Password Step */}
          {step === "reset_password" && (
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <Lock className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Set New Password</h3>
                <p className="text-sm text-gray-600">Create a new password for your account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
