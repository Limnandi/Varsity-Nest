"use client"

import { useState, useEffect } from "react"
import { useStackApp, useUser } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UserCheck, Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Home } from "lucide-react"
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator"

export default function AgentRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [state, setState] = useState<{ error?: string; success?: boolean; message?: string }>()
  const [isPending, setIsPending] = useState(false)
  const [emailCheckMessage, setEmailCheckMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
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

  const checkEmailAvailability = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailCheckMessage(null)
      return
    }

    setIsCheckingEmail(true)
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.available) {
        setEmailCheckMessage({ type: 'success', message: '✓ Email is available' })
      } else {
        setEmailCheckMessage({ 
          type: 'error', 
          message: data.reason || 'Email already registered' 
        })
      }
    } catch (error) {
      console.error('Email check failed:', error)
      setEmailCheckMessage(null)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setState({})

    try {
      const form = new FormData(e.currentTarget)
      const email = String(form.get('email') || '')
      const password = String(form.get('password') || '')
      const confirmPassword = String(form.get('confirmPassword') || '')
      const firstName = String(form.get('firstName') || '')
      const lastName = String(form.get('lastName') || '')
      const phone = String(form.get('phone') || '')
      const institution = String(form.get('institution') || '')

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (emailCheckMessage?.type === 'error') {
        throw new Error('This email is already registered. Please use a different email or log in.')
      }

      const callbackBase = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const signupResult = await app.signUpWithCredential({ 
        email, 
        password,
        verificationCallbackUrl: `${callbackBase}/auth/check-email`,
        noRedirect: true,
      })
      
      if ((signupResult as any).status === "error") {
        const errorMessage = (signupResult as any).error?.message || 'Registration failed'
        throw new Error(errorMessage)
      }
      
      let stackUserId: string | null = null
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const currentUser = await app.getUser()
        if (currentUser?.id) {
          stackUserId = currentUser.id
          try {
            const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
            if (fullName) {
              await currentUser.update({ displayName: fullName })
            }
          } catch (updateError) {
            console.warn('Failed to update Stack Auth display name:', updateError)
          }
          
          // Note: Verification email is automatically sent by StackAuth when signUpWithCredential is called
          // No need to manually resend it here
        }
      } catch (error) {
        console.warn('Error getting StackAuth user:', error)
      }

      if (!stackUserId) {
        throw new Error('Failed to get user ID from StackAuth. Please try again.')
      }

      const payload = new FormData()
      payload.set('userId', stackUserId)
      payload.set('email', email)
      payload.set('firstName', firstName)
      payload.set('lastName', lastName)
      payload.set('phone', phone)
      payload.set('institution', institution)
      payload.set('role', 'agent')

      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        body: payload,
      })
      
      if (!resp.ok) {
        let errorMessage = 'Registration failed'
        try {
          const j = await resp.json()
          console.error('Registration error response:', j)
          errorMessage = j.details ? `${j.error}: ${JSON.stringify(j.details)}` : (j.error || 'Registration failed')
        } catch (jsonError) {
          try {
            const textResponse = await resp.text()
            console.error('Registration error (non-JSON):', textResponse)
            errorMessage = textResponse || `Registration failed with status ${resp.status}`
          } catch (textError) {
            console.error('Failed to read error response:', textError)
            errorMessage = `Registration failed with status ${resp.status}`
          }
        }
        throw new Error(errorMessage)
      }

      router.push('/auth/check-email')
    } catch (error: any) {
      let errorMessage = error.message || 'Registration failed. Please try again.'
      
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please log in or use a different email.'
      }
      
      setState({ 
        error: errorMessage
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center relative">
      <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-green-500/30 p-10 max-w-2xl w-full auth-card-container">
        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-green-500/30 rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-emerald-500/30 rounded-br-3xl"></div>
        <Link 
          href="/" 
          className="absolute top-5 right-5 group p-2.5 border border-white/20 bg-black/30 backdrop-blur-xl rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-110 hover:shadow-green-500/30 hover:border-green-500/50 z-10"
        >
          <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        </Link>

        <div className="text-center mb-10 relative">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg shadow-green-500/20">
              <UserCheck className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-green-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight break-words px-2">
            Agent Registration
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base mt-1 break-words px-2">Register as an accommodation agent</p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-200 mb-2.5">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    required
                    disabled={isPending}
                    className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-neutral-200 mb-2.5">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    required
                    disabled={isPending}
                    className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-200 mb-2.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  onBlur={(e) => checkEmailAvailability(e.target.value)}
                  onChange={() => setEmailCheckMessage(null)}
                  disabled={isPending}
                  className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="agent@varsitynest.space"
                />
              </div>
              {isCheckingEmail && (
                <p className="text-sm text-neutral-400 mt-2">Checking email availability...</p>
              )}
              {emailCheckMessage && !isCheckingEmail && (
                <p className={`text-sm mt-2 ${emailCheckMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {emailCheckMessage.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-neutral-200 mb-2.5">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  disabled={isPending}
                  className="w-full px-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="+27 82 123 4567"
                />
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-semibold text-neutral-200 mb-2.5">Business/Company Name</label>
                <input
                  id="institution"
                  type="text"
                  name="institution"
                  required
                  disabled={isPending}
                  className="w-full px-4 py-3.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white text-base placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Your Company Name"
                />
              </div>
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

            <div className="pt-2 pb-4">
              <p className="text-xs text-neutral-400 text-center leading-relaxed break-words px-2">
                By clicking Create Agent Account, you agree to our{" "}
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

            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white py-3.5 px-6 rounded-xl font-semibold text-base hover:from-green-500 hover:via-emerald-500 hover:to-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
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
                    <span className="relative">Create Agent Account</span>
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      →
                    </span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

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

