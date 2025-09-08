"use client"

import { useState, useRef } from "react"
import { OAuthButton, useStackApp } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const app = useStackApp()

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
      // Step 1: Try StackAuth first
      try {
        const result = await app.signInWithCredential({ email, password })
        if ((result as any)?.error) {
          throw new Error((result as any).error)
        }
        router.push("/auth/redirect")
        return
      } catch (stackError: any) {
        // StackAuth failed, try database fallback
        console.log("StackAuth authentication failed, trying database fallback:", stackError.message)
        
        // Step 2: Fallback to database authentication
        const fallbackResponse = await fetch('/api/auth/fallback-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const fallbackData = await fallbackResponse.json()

        if (fallbackResponse.ok && fallbackData.success) {
          // Database authentication successful
          // Create a session for the database user
          const sessionData = {
            user: fallbackData.user,
            authMethod: fallbackData.authMethod
          }
          
          // Store session data in localStorage for now
          // In production, you might want to use httpOnly cookies
          localStorage.setItem('varsityNestSession', JSON.stringify(sessionData))
          
          router.push("/auth/redirect")
          return
        } else {
          // Both StackAuth and database authentication failed
          throw new Error(fallbackData.error || "Invalid email or password")
        }
      }
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.")
      recaptchaRef.current?.reset()
    } finally {
      setIsPending(false)
    }
  }

  const handleForgotPassword = async () => {
    setError("")
    if (!email) {
      setError("Enter your email first, then click Forgot Password")
      return
    }
    try {
      await app.sendForgotPasswordEmail(email)
      setError("If an account exists, a reset link was sent.")
    } catch (e: any) {
      setError(e.message || "Could not send reset email")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-blue-900 px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-600">Access your Varsity Nest dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </button>

            <div className="flex items-center justify-between">
              <OAuthButton provider="google" type="sign-in" />
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-purple-600 hover:text-purple-500"
              >
                Forgot password?
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <a href="/auth/register" className="font-medium text-purple-600 hover:text-purple-500">
                  Register here
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
