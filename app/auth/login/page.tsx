"use client"

import { useState, useRef } from "react"
import { OAuthButton, useStackApp } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, Home } from "lucide-react"
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
      // Try StackAuth first for OAuth users
      try {
        const result = await app.signInWithCredential({ email, password })
        if ((result as any)?.error) {
          throw new Error((result as any).error)
        }
        router.push("/auth/redirect")
        return
      } catch (stackError: any) {
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
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8">
          {/* Home Button */}
          <Link 
            href="/" 
            className="absolute top-4 left-4 group p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/20"
          >
            <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </Link>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl tracking-tight">Welcome Back</h1>
            <p className="text-neutral-300 text-lg">Access your Varsity Nest dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="w-full pl-12 pr-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="w-full pl-12 pr-14 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
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
              className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">
                {isPending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="flex items-center justify-between">
              <div className="group relative w-full">
                <OAuthButton 
                  provider="google" 
                  type="sign-in"
                  className="!w-full !px-6 !py-3 !bg-black/20 !text-white !border !border-white/20 !rounded-xl !font-medium !shadow-lg !hover:bg-white/5 !hover:shadow-blue-500/20 !transition-all !duration-300 !hover:scale-105 !active:scale-95 !flex !items-center !justify-center !space-x-3 !backdrop-blur-xl"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-neutral-400">
                Don&apos;t have an account?{" "}
                <a href="/auth/register" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
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
