"use client"

import { useState, useEffect } from "react"
import { useStackApp, useUser } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Home, Phone } from "lucide-react"
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Student Sign Up | Varsity Nest',
  description: 'Join Varsity Nest to find your ideal student accommodation. Sign up as a student today.',
}

export default function StudentRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [state, setState] = useState<{ error?: string; success?: boolean; message?: string }>()
  const [isPending, setIsPending] = useState(false)
  const app = useStackApp()
  const router = useRouter()
  const user = useUser()

  // Redirect if user is already logged in
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (user) {
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
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setState({})

    try {
      const form = new FormData(e.currentTarget)
      const name = String(form.get('name') || '')
      const email = String(form.get('email') || '')
      const password = String(form.get('password') || '')
      const confirmPassword = String(form.get('confirmPassword') || '')
      const cellNumber = String(form.get('cellNumber') || '')
      const studentNumber = String(form.get('studentNumber') || '')

      if (password !== confirmPassword) {
        setState({ error: 'Passwords do not match' })
        setIsPending(false)
        return
      }

      if (!studentNumber || studentNumber.trim().length === 0) {
        setState({ error: 'Student number is required' })
        setIsPending(false)
        return
      }

      // Validate email domain against whitelisted domains in database
      const domainValidationResponse = await fetch('/api/auth/validate-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const domainValidation = await domainValidationResponse.json()

      if (!domainValidation.isValid) {
        setState({ 
          error: domainValidation.error || 'Please use your university email address.' 
        })
        setIsPending(false)
        return
      }

      // Use the university from database validation
      const university = domainValidation.university

      const callbackBase = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      
      // Add timeout to signup call
      const signupPromise = app.signUpWithCredential({ 
        email, 
        password,
        verificationCallbackUrl: `${callbackBase}/auth/check-email`,
        noRedirect: true,
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout. Please try again.')), 30000)
      )
      
      const signupResult = await Promise.race([signupPromise, timeoutPromise])
      
      // Check result status (official SDK pattern)
      if ((signupResult as any).status === "error") {
        setState({ 
          error: (signupResult as any).error?.message || 'Registration failed' 
        })
        setIsPending(false)
        return
      }
      
      // Ensure user exists in Neon DB and send verification email
      try {
        // Wait briefly for the user record to be available, then fetch user id
        await new Promise(resolve => setTimeout(resolve, 1000))
        const currentUser = await app.getUser()
        if (currentUser?.id) {
          // Update Stack Auth user with display name
          try {
            await currentUser.update({ displayName: name })
          } catch (updateError) {
            console.warn('Failed to update Stack Auth display name:', updateError)
          }
          
          // Add timeout to ensure-user API call
          const ensureUserPromise = fetch('/api/auth/ensure-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: currentUser.id, 
              fullName: name,
              cellNumber: cellNumber,
              studentNumber: studentNumber,
              university: university
            })
          })
          
          const ensureUserTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database update timeout')), 20000)
          )
          
          await Promise.race([ensureUserPromise, ensureUserTimeout])
          
          // Note: Verification email is automatically sent by StackAuth when signUpWithCredential is called
          // No need to manually resend it here
        }
      } catch (dbError) {
        console.warn('Database operations failed:', dbError)
        // Don't throw here, registration was successful
      }
      
      // Redirect to check-email page after successful registration
      router.push('/auth/check-email')
    } catch (error: any) {
      console.error('Registration error:', error)
      setState({ 
        error: error.message || 'Registration failed. Please try again.' 
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center relative">
      <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-500/30 p-10 max-w-2xl w-full auth-card-container">
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight break-words px-2">
            Student Registration
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base mt-1 break-words px-2">Join Varsity Nest with your university email</p>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-8">
          {state?.error && (
            <div className="p-4 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl flex items-start space-x-3 shadow-lg shadow-red-500/10">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <span className="text-red-300 text-sm leading-relaxed break-words flex-1">{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="p-4 border border-green-500/50 bg-green-500/10 backdrop-blur-xl rounded-xl flex items-start space-x-3 shadow-lg shadow-green-500/10">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <span className="text-green-300 text-sm leading-relaxed break-words flex-1">{state.message}</span>
            </div>
          )}
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-neutral-200 mb-2.5 transition-colors">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-blue-400 z-10" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    disabled={isPending}
                    className="relative w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-200 mb-2.5 transition-colors">University Email</label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-blue-400 z-10" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    disabled={isPending}
                    className="relative w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="student@ufs4life.ac.za"
                  />
                </div>
              </div>
            </div>
            
            <div className="text-center pb-2">
              <p className="text-xs text-neutral-500 break-words px-2">
                Please use your university email address
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-200 mb-2.5 transition-colors">Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-blue-400 z-10" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isPending}
                    className="relative w-full pl-12 pr-14 py-3.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-all duration-200 p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 z-10"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2.5">
                    <PasswordStrengthIndicator password={password} show={password.length > 0} />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-200 mb-2.5 transition-colors">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-blue-400 z-10" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    disabled={isPending}
                    className="relative w-full pl-12 pr-14 py-3.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPending}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-all duration-200 p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 z-10"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="cellNumber" className="block text-sm font-semibold text-neutral-200 mb-2.5 transition-colors">Cell Number</label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-blue-400 z-10" />
                  <input
                    id="cellNumber"
                    type="tel"
                    name="cellNumber"
                    disabled={isPending}
                    className="relative w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="012 345 6789"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Optional
                </p>
              </div>

              <div>
                <label htmlFor="studentNumber" className="block text-sm font-semibold text-neutral-200 mb-2.5 transition-colors">Student Number</label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                  <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-blue-400 z-10" />
                  <input
                    id="studentNumber"
                    type="text"
                    name="studentNumber"
                    required
                    disabled={isPending}
                    className="relative w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., 2023123456"
                  />
                </div>
              </div>
            </div>

            {/* Terms Notice */}
            <div className="pt-2 pb-4">
              <p className="text-xs text-neutral-400 text-center leading-relaxed break-words px-2">
                By clicking Create Account, you agree to our{" "}
                <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors underline break-words">
                  Terms
                </Link>
                ,{" "}
                <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors underline break-words">
                  Privacy Policy
                </Link>
                {" "}and{" "}
                <Link href="/cookies" className="text-blue-400 hover:text-blue-300 transition-colors underline break-words">
                  Cookies Policy
                </Link>
                .
              </p>
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
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span className="relative">Create Account</span>
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      →
                    </span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            {/* Register Link */}
            <div className="pt-6 border-t border-white/10">
              <p className="text-center text-sm text-neutral-400 break-words px-2">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-all duration-200 break-words hover:underline hover:underline-offset-2 inline-flex items-center gap-1 group/link"
                >
                  <span className="inline-block group-hover/link:-translate-x-1 transition-transform duration-200">←</span>
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
      </div>
    </div>
  )
}
