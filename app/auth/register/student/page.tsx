"use client"

import { useState } from "react"
import { useStackApp } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Home, Phone } from "lucide-react"
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator"

export default function StudentRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [cellNumber, setCellNumber] = useState("")
  const [state, setState] = useState<{ error?: string; success?: boolean; message?: string }>()
  const [isPending, setIsPending] = useState(false)
  const app = useStackApp()
  const router = useRouter()

  // Handle cell number input change
  const handleCellNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCellNumber(value)
  }

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
          
          // Add timeout to verification email API call
          const verificationPromise = fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          })
          
          const verificationTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Verification email timeout')), 15000)
          )
          
          await Promise.race([verificationPromise, verificationTimeout])
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
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12 flex items-center justify-center">
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/20 p-10 max-w-2xl w-full">
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
            <GraduationCap className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Student Registration
          </h1>
          <p className="text-neutral-300 text-base mt-1">Join Varsity Nest with your university email</p>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-8">
          {state?.error && (
            <div className="p-4 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-300 text-sm leading-relaxed">{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="p-4 border border-green-500/50 bg-green-500/10 backdrop-blur-xl rounded-xl flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-green-300 text-sm leading-relaxed">{state.message}</span>
            </div>
          )}
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-neutral-200 mb-2.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    disabled={isPending}
                    className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-200 mb-2.5">University Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    disabled={isPending}
                    className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="student@ufs4life.ac.za"
                  />
                </div>
              </div>
            </div>
            
            <div className="text-center pb-2">
              <p className="text-xs text-neutral-500">
                Please use your university email address
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-200 mb-2.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isPending}
                    className="w-full pl-12 pr-14 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1 disabled:opacity-50"
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
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-200 mb-2.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    disabled={isPending}
                    className="w-full pl-12 pr-14 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPending}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1 disabled:opacity-50"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="cellNumber" className="block text-sm font-semibold text-neutral-200 mb-2.5">Cell Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="cellNumber"
                    type="tel"
                    name="cellNumber"
                    value={cellNumber}
                    onChange={handleCellNumberChange}
                    disabled={isPending}
                    className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="012 345 6789"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Optional
                </p>
              </div>

              <div>
                <label htmlFor="studentNumber" className="block text-sm font-semibold text-neutral-200 mb-2.5">Student Number</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="studentNumber"
                    type="text"
                    name="studentNumber"
                    required
                    disabled={isPending}
                    className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., 2023123456"
                  />
                </div>
              </div>
            </div>

            {/* Terms Notice */}
            <div className="pt-2 pb-4">
              <p className="text-xs text-neutral-400 text-center leading-relaxed">
                By clicking Create Account, you agree to our{" "}
                <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                  Terms
                </Link>
                ,{" "}
                <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                  Privacy Policy
                </Link>
                {" "}and{" "}
                <Link href="/cookies" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                  Cookies Policy
                </Link>
                .
              </p>
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
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Register Link */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-center text-sm text-neutral-400">
                Already have an account?{" "}
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
