"use client"

import { useState, useRef, useEffect } from "react"
import { OAuthButton, useStackApp } from "@stackframe/stack"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, Home, CheckCircle } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"
import { publicEnv } from "@/lib/env.client"
import EmailVerificationModal from "@/components/EmailVerificationModal"
import ForgotPasswordModal from "@/components/ForgotPasswordModal"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [verificationData, setVerificationData] = useState<{
    userId: string
    firstName?: string
    lastName?: string
  } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const app = useStackApp()

  // Check for URL parameters (verified, error, etc.)
  useEffect(() => {
    const verified = searchParams.get('verified')
    const errorParam = searchParams.get('error')
    
    if (verified === 'true') {
      setSuccessMessage("Email verified successfully! You can now sign in.")
      // Clear the URL parameter after showing message
      window.history.replaceState({}, '', '/auth/login')
    }
    
    if (errorParam === 'email-not-verified') {
      setError("Please verify your email before signing in. Check your inbox for the verification link.")
    }
  }, [searchParams])

  const checkEmailVerification = async (email: string) => {
    try {
      const response = await fetch('/api/auth/check-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
      return null
    } catch (error) {
      console.error('Error checking email verification:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    const recaptchaToken = recaptchaRef.current?.getValue()
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification")
      return
    }

    setIsPending(true)
    setError("")

    try {
      // First check email verification status
      const verificationStatus = await checkEmailVerification(email)
      
      if (verificationStatus && !verificationStatus.emailVerified) {
        // Email not verified, show modal
        setVerificationData({
          userId: verificationStatus.userId,
          firstName: verificationStatus.firstName,
          lastName: verificationStatus.lastName
        })
        setShowVerificationModal(true)
        setIsPending(false)
        recaptchaRef.current?.reset()
        return
      }

      // Try StackAuth first for OAuth users
      try {
        const result = await app.signInWithCredential({ email, password })
        if ((result as any)?.error) {
          throw new Error((result as any).error)
        }
        
        // Email verification will be checked on the redirect/session endpoint
        router.push("/auth/redirect")
        return
      } catch (stackError: any) {
        // Check if error is due to email not verified
        if (stackError.message?.includes('email') && stackError.message?.includes('verif')) {
          setError("Please verify your email before signing in. Check your inbox for the verification link.")
          recaptchaRef.current?.reset()
          setIsPending(false)
          return
        }
        
        // StackAuth failed, try secure database authentication
        console.log("StackAuth authentication failed, trying secure database authentication:", stackError.message)
        
        const secureResponse = await fetch('/api/auth/secure-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const secureData = await secureResponse.json()

        if (secureResponse.ok && secureData.success) {
          // Secure authentication successful - session is set via HTTP-only cookie
          router.push("/auth/redirect")
          return
        } else {
          // Both StackAuth and secure authentication failed
          throw new Error(secureData.error || "Invalid email or password")
        }
      }
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.")
      recaptchaRef.current?.reset()
    } finally {
      setIsPending(false)
    }
  }

  const handleForgotPassword = () => {
    setError("")
    setShowForgotPasswordModal(true)
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false)
  }

  const closeVerificationModal = () => {
    setShowVerificationModal(false)
    setVerificationData(null)
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
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Welcome Back
          </h1>
          <p className="text-neutral-300 text-base mt-1">Sign in to access your Varsity Nest dashboard</p>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-8">
          {successMessage && (
            <div className="p-4 border border-green-500/50 bg-green-500/10 backdrop-blur-xl rounded-xl flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-green-300 text-sm leading-relaxed">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl flex flex-col space-y-2">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-300 text-sm leading-relaxed">{error}</span>
              </div>
              {error.includes('verify your email') && (
                <Link href="/auth/check-email" className="text-xs text-blue-400 hover:text-blue-300 underline ml-8 mt-1">
                  Resend verification email →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-neutral-200 mb-2.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@varsitynest.space"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-200 mb-2.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="w-full pl-12 pr-14 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1 disabled:opacity-50"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
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

          {/* ReCAPTCHA */}
          <div className="flex justify-center py-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={publicEnv.RECAPTCHA_SITE_KEY}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-6 rounded-xl font-semibold text-base hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span className="relative z-10 flex items-center justify-center">
              {isPending ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* OAuth Button */}
          <div className="flex items-center justify-between">
            <div className="group relative w-full">
              <div className="!w-full !px-6 !py-3 !bg-black/20 !text-white !border !border-white/20 !rounded-xl !font-medium !shadow-lg !hover:bg-white/5 !hover:shadow-blue-500/20 !transition-all !duration-300 !hover:scale-105 !active:scale-95 !flex !items-center !justify-center !space-x-3 !backdrop-blur-xl">
                <OAuthButton 
                  provider="google" 
                  type="sign-in"
                />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isPending}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>

          {/* Register Link */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-center text-sm text-neutral-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </form>

        {/* Email Verification Modal */}
        {verificationData && (
          <EmailVerificationModal
            isOpen={showVerificationModal}
            onClose={closeVerificationModal}
            email={email}
            userId={verificationData.userId}
            firstName={verificationData.firstName}
            lastName={verificationData.lastName}
          />
        )}

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={showForgotPasswordModal}
          onClose={closeForgotPasswordModal}
          initialEmail={email}
        />
      </div>
    </div>
  )
}

