"use client"

import { useState, useEffect } from "react"
import { useStackApp, useUser } from "@stackframe/stack"
import { OAuthButton } from "@stackframe/stack" 
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, Home, CheckCircle } from "lucide-react"
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
  const app = useStackApp()
  const user = useUser()

  // Redirect if user is already logged in
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (user && searchParams.get('verified') !== 'true') {
        try {
          // Fetch user role from session API
          const response = await fetch('/api/auth/session', { credentials: 'include' })
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              const userRole = result.data.role
              // Redirect based on role
              switch (userRole) {
                case 'admin':
                  router.replace('/admin/dashboard')
                  return
                case 'provider':
                  router.replace('/provider/dashboard')
                  return
                case 'agent':
                  router.replace('/agent/dashboard')
                  return
                case 'student':
                default:
                  router.replace('/student/dashboard')
                  return
              }
            }
          }
        } catch (error) {
          console.error('Error checking session:', error)
        }
      }
    }
    checkAuthAndRedirect()
  }, [user, router, searchParams])

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
        return
      }

      // For the special test provider account, skip StackAuth and authenticate directly against the secure DB.
      const normalizedEmail = email.trim().toLowerCase()
      const isTestProvider = normalizedEmail === 'testprovider@example.com'

      if (isTestProvider) {
        // Bypass StackAuth for this test account and use secure database authentication only.
        const secureResponse = await fetch('/api/auth/secure-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const secureData = await secureResponse.json()

        if (secureResponse.ok && secureData.success) {
          router.push('/auth/redirect')
          return
        } else {
          throw new Error(secureData.error || 'Invalid email or password')
        }
      }

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
    <div className="min-h-screen px-4 py-12 flex items-center justify-center relative">
      <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-500/30 p-10 max-w-lg w-full auth-card-container">
        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-blue-500/30 rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-500/30 rounded-br-3xl"></div>

        {/* Home Button */}
        <Link 
          href="/" 
          className="absolute top-5 right-5 group p-2.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/30 hover:border-blue-500/50 z-10"
        >
          <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        </Link>

        {/* Header Section */}
        <div className="text-center mb-10 relative">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight break-words">
            Welcome Back
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base mt-1 break-words px-2">Sign in to access your Varsity Nest dashboard</p>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-8">
          {successMessage && (
            <div className="p-4 border border-green-500/50 bg-green-500/10 backdrop-blur-xl rounded-xl flex items-start space-x-3 shadow-lg shadow-green-500/10">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <span className="text-green-300 text-sm leading-relaxed break-words flex-1">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl flex flex-col space-y-2 shadow-lg shadow-red-500/10">
              <div className="flex items-start space-x-3 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <span className="text-red-300 text-sm leading-relaxed break-words flex-1">{error}</span>
              </div>
              {error.includes('verify your email') && (
                <Link href="/auth/check-email" className="text-xs text-blue-400 hover:text-blue-300 underline ml-11 mt-1 break-words transition-colors hover:underline-offset-2">
                  Resend verification email →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-neutral-200 mb-2.5 transition-colors">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-blue-400 z-10" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="relative w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@varsitynest.space"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-200 mb-2.5 transition-colors">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-blue-400 z-10" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="relative w-full pl-12 pr-14 py-3.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-all duration-200 p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 z-10"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="group relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white py-3.5 px-6 rounded-xl font-semibold text-base hover:from-blue-500 hover:via-purple-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10 flex items-center justify-center">
              {isPending ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span className="relative">Sign In</span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    →
                  </span>
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>

          {/* OAuth Buttons */}
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-4">
            <OAuthButton 
              provider="google" 
              type="sign-in"
            />
            <OAuthButton 
              provider="microsoft" 
              type="sign-in"
            />
          </div>
          
          {/* Forgot Password Link */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isPending}
              className="text-sm text-blue-400 hover:text-blue-300 transition-all duration-200 font-medium disabled:opacity-50 hover:underline hover:underline-offset-2"
            >
              Forgot password?
            </button>
          </div>

          {/* Register Link */}
          <div className="pt-6 border-t border-white/10">
            <p className="text-center text-sm text-neutral-400 break-words px-2">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-all duration-200 break-words hover:underline hover:underline-offset-2 inline-flex items-center gap-1 group/link"
              >
                Register here
                <span className="inline-block group-hover/link:translate-x-1 transition-transform duration-200">→</span>
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

