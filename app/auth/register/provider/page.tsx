"use client"

import { useState } from "react"
import { useStackApp } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building, Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Upload, X, Home } from "lucide-react"
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator"

export default function ProviderRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [isAccredited, setIsAccredited] = useState<"yes" | "no" | "">("")
  const [accreditedBy, setAccreditedBy] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [state, setState] = useState<{ error?: string; success?: boolean; message?: string }>()
  const [isPending, setIsPending] = useState(false)
  const [emailCheckMessage, setEmailCheckMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const app = useStackApp()
  const router = useRouter()

  // Check email availability with debounce
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

      // Check if email is available before proceeding
      if (emailCheckMessage?.type === 'error') {
        throw new Error('This email is already registered. Please use a different email or log in.')
      }

      // Only require documents if provider is accredited
      if (isAccredited === "yes" && (uploadedFiles.length < 1 || uploadedFiles.length > 2)) {
        throw new Error('Please upload 1-2 documents (PDF or images)')
      }

      // Client-side sign-up with StackAuth (matches official SDK pattern)
      const callbackBase = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const signupResult = await app.signUpWithCredential({ 
        email, 
        password,
        verificationCallbackUrl: `${callbackBase}/auth/check-email`,
        noRedirect: true,
      })
      
      // Check result status (official SDK pattern)
      if ((signupResult as any).status === "error") {
        const errorMessage = (signupResult as any).error?.message || 'Registration failed'
        throw new Error(errorMessage)
      }
      
      // Ensure user exists in Neon DB and send verification email
      let stackUserId: string | null = null
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const currentUser = await app.getUser()
        if (currentUser?.id) {
          stackUserId = currentUser.id
          // Update Stack Auth user with display name
          try {
            const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
            if (fullName) {
              await currentUser.update({ displayName: fullName })
            }
          } catch (updateError) {
            console.warn('Failed to update Stack Auth display name:', updateError)
          }
          
          await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          })
        }
      } catch (error) {
        console.warn('Error getting StackAuth user:', error)
      }

      if (!stackUserId) {
        throw new Error('Failed to get user ID from StackAuth. Please try again.')
      }

      // Build multipart form for server registration (DB + docs)
      const payload = new FormData()
      payload.set('userId', stackUserId)
      payload.set('email', email)
      payload.set('firstName', firstName)
      payload.set('lastName', lastName)
      payload.set('phone', phone)
      payload.set('institution', institution)
      for (const f of uploadedFiles) payload.append('documents', f)

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
          // If JSON parsing fails, try to get the text response
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

      // Redirect to check-email page after successful registration
      router.push('/auth/check-email')
    } catch (error: any) {
      // Handle specific error messages
      let errorMessage = error.message || 'Registration failed. Please try again.'
      
      // StackAuth duplicate email error
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

  const handleAccreditationChange = (university: string, checked: boolean) => {
    if (checked) {
      setAccreditedBy([...accreditedBy, university])
    } else {
      setAccreditedBy(accreditedBy.filter((u) => u !== university))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const isValidType = file.type === "application/pdf" ||
                         file.type.startsWith("image/")
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      
      if (!isValidType) {
        setState({ error: 'Only PDF and image files are allowed' })
        return false
      }
      if (!isValidSize) {
        setState({ error: 'File size must be less than 5MB' })
        return false
      }
      return true
    })

    if (uploadedFiles.length + validFiles.length > 2) {
      alert("You can only upload 1-2 files")
      return
    }
    if (uploadedFiles.length + validFiles.length < 1) {
      alert("You must upload at least 1 file")
      return
    }

    setUploadedFiles([...uploadedFiles, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
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
          <div className="mx-auto mb-6 w-20 h-20 border border-purple-500/50 bg-purple-500/10 rounded-full flex items-center justify-center shadow-[0_0_20px_theme(colors.purple.500/40%)]">
            <Building className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Provider Registration
          </h1>
          <p className="text-neutral-300 text-base mt-1">Register as a service provider</p>
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
                  placeholder="provider@varsitynest.space"
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
                <label htmlFor="institution" className="block text-sm font-semibold text-neutral-200 mb-2.5">Institution/Company</label>
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

            <div>
              <label className="block text-sm font-semibold text-neutral-200 mb-2.5">Are you accredited?</label>
              <div className="space-y-3">
                <label className="flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
                  <input
                    type="radio"
                    name="accreditation"
                    value="yes"
                    checked={isAccredited === "yes"}
                    onChange={(e) => setIsAccredited(e.target.value as "yes" | "no" | "")}
                    disabled={isPending}
                    className="w-4 h-4 text-blue-600 border-white/20 focus:ring-blue-500 bg-black/20 disabled:opacity-50"
                  />
                  <span className="text-white">Yes, I am accredited</span>
                </label>
                <label className="flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
                  <input
                    type="radio"
                    name="accreditation"
                    value="no"
                    checked={isAccredited === "no"}
                    onChange={(e) => setIsAccredited(e.target.value as "yes" | "no" | "")}
                    disabled={isPending}
                    className="w-4 h-4 text-blue-600 border-white/20 focus:ring-blue-500 bg-black/20 disabled:opacity-50"
                  />
                  <span className="text-white">No, but I&apos;m working towards accreditation</span>
                </label>
              </div>
            </div>

            {isAccredited === "yes" && (
              <div>
                <label className="block text-sm font-semibold text-neutral-200 mb-2.5">Accredited by:</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
                    <input
                      type="checkbox"
                      checked={accreditedBy.includes("UFS")}
                      onChange={(e) => handleAccreditationChange("UFS", e.target.checked)}
                      disabled={isPending}
                      className="w-4 h-4 text-blue-600 border-white/20 rounded focus:ring-blue-500 bg-black/20 disabled:opacity-50"
                    />
                    <span className="text-white">University of the Free State (UFS)</span>
                  </label>
                  <label className="flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
                    <input
                      type="checkbox"
                      checked={accreditedBy.includes("CUT")}
                      onChange={(e) => handleAccreditationChange("CUT", e.target.checked)}
                      disabled={isPending}
                      className="w-4 h-4 text-blue-600 border-white/20 rounded focus:ring-blue-500 bg-black/20 disabled:opacity-50"
                    />
                    <span className="text-white">Central University of Technology (CUT)</span>
                  </label>
                </div>
              </div>
            )}

            {isAccredited === "yes" && (
              <div>
                <label className="block text-sm font-semibold text-neutral-200 mb-2.5">Upload Documents (1-2 files)</label>
                <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-xl rounded-xl p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
                    <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-neutral-300 text-sm mb-4">
                    Upload accreditation certificates, business registration, or other relevant documents
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={isPending}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 cursor-pointer ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ pointerEvents: isPending ? 'none' : 'auto' }}
                  >
                    <span className="relative z-10">Choose Files</span>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </label>
                  <p className="text-xs text-neutral-500 mt-3">
                    PDF or images, max 5MB each
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                        <span className="text-sm text-neutral-300 truncate flex-1 mr-3">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={isPending}
                          className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg disabled:opacity-50 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Terms Notice */}
            <div className="pt-2 pb-4">
              <p className="text-xs text-neutral-400 text-center leading-relaxed">
                By clicking Create Provider Account, you agree to our{" "}
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
                  "Create Provider Account"
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
