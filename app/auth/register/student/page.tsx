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

  // Get university from email domain
  const getUniversityFromEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase()
    if (domain === 'ufs4life.ac.za') {
      return 'UFS'
    }
    return 'CUT' // Default to CUT for other whitelisted domains
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
        throw new Error('Passwords do not match')
      }

      if (!studentNumber || studentNumber.trim().length === 0) {
        throw new Error('Student number is required')
      }

      // Automatically determine university from email domain
      const university = getUniversityFromEmail(email)

       const callbackBase = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const signupResult = await app.signUpWithCredential({ 
        email, 
        password,
        verificationCallbackUrl: `${callbackBase}/auth/check-email`,
        noRedirect: true,
      })
      
      // Check result status (official SDK pattern)
      if ((signupResult as any).status === "error") {
        throw new Error((signupResult as any).error?.message || 'Registration failed')
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
          
          await fetch('/api/auth/ensure-user', {
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
          await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          })
        }
      } catch {}
      
      // Redirect to check-email page after successful registration
      router.push('/auth/check-email')
    } catch (error: any) {
      setState({ 
        error: error.message || 'Registration failed. Please try again.' 
      })
    } finally {
      setIsPending(false)
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
            <div className="p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl w-fit mx-auto mb-4">
              <GraduationCap className="w-16 h-16 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl tracking-tight">Student Registration</h1>
            <p className="text-neutral-300 text-lg">Join Varsity Nest with your university email</p>
          </div>

          {state?.error && (
            <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300 text-sm">{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="mb-6 p-4 border border-green-500/50 bg-green-500/10 backdrop-blur-xl rounded-xl flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-300 text-sm">{state.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full pl-12 pr-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">University Email *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full pl-12 pr-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="student@ufs4life.ac.za"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Use your university email address. Only whitelisted domains are allowed for registration.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-12 pr-14 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="Enter password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              <div className="mt-3">
                <PasswordStrengthIndicator password={password} show={password.length > 0} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  className="w-full pl-12 pr-14 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Cell Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="tel"
                  name="cellNumber"
                  value={cellNumber}
                  onChange={handleCellNumberChange}
                  className="w-full pl-12 pr-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="012 345 6789"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Enter your cell number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Student Number *</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  name="studentNumber"
                  required
                  className="w-full pl-12 pr-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="e.g., 2023123456"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">
                {isPending ? "Creating Account..." : "Create Account"}
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="text-center">
              <p className="text-sm text-neutral-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
