"use client"

import { useState } from "react"
import { useStackApp, useUser } from "@stackframe/stack"
import Link from "next/link"
import { Building, Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Upload, X, Home } from "lucide-react"

export default function ProviderRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isAccredited, setIsAccredited] = useState<"yes" | "no" | "">("")
  const [accreditedBy, setAccreditedBy] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [state, setState] = useState<{ error?: string; success?: boolean; message?: string }>()
  const [isPending, setIsPending] = useState(false)
  const app = useStackApp()
  const user = useUser({ or: 'return-null' })

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

      // Only require documents if provider is accredited
      if (isAccredited === "yes" && (uploadedFiles.length < 1 || uploadedFiles.length > 2)) {
        throw new Error('Please upload 1-2 documents (PDF or images)')
      }

      // Client-side sign-up with StackAuth
      const callbackBase = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      await app.signUpWithCredential({ 
        email, 
        password,
        verificationCallbackUrl: `${callbackBase}/auth/check-email`
      })
      // Set Stack display name from first/last name
      try {
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        if (fullName) {
          await user?.update({ displayName: fullName })
        }
      } catch {}

      // Build multipart form for server registration (DB + docs)
      const payload = new FormData()
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
        const j = await resp.json().catch(() => ({}))
        throw new Error(j.error || 'Registration failed')
      }

      setState({ success: true, message: 'Account created. Check your email to verify.' })
    } catch (error: any) {
      setState({ 
        error: error.message || 'Registration failed. Please try again.' 
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
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8">
          {/* Home Button */}
          <Link 
            href="/" 
            className="absolute top-4 left-4 group p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/20"
          >
            <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </Link>
          <div className="text-center mb-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/50 bg-purple-500/10 shadow-[0_0_20px_theme(colors.purple.500/40%)] mb-6">
              <Building className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl tracking-tight">Provider Registration</h1>
            <p className="text-neutral-300 text-lg">Join Varsity Nest as an accommodation provider</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">First Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type="text"
                    name="firstName"
                    required
                    className="w-full pl-12 pr-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">Last Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type="text"
                    name="lastName"
                    required
                    className="w-full pl-12 pr-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full pl-12 pr-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="provider@varsitynest.space"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="+27 82 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">Institution/Company</label>
                <input
                  type="text"
                  name="institution"
                  className="w-full px-4 py-4 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="Your Company Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Are you accredited? *</label>
              <div className="space-y-4">
                <label className="flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer">
                  <input
                    type="radio"
                    name="accreditation"
                    value="yes"
                    checked={isAccredited === "yes"}
                    onChange={(e) => setIsAccredited(e.target.value as "yes" | "no" | "")}
                    className="w-4 h-4 text-blue-600 border-white/20 focus:ring-blue-500 bg-black/20"
                  />
                  <span className="text-white">Yes, I am accredited</span>
                </label>
                <label className="flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer">
                  <input
                    type="radio"
                    name="accreditation"
                    value="no"
                    checked={isAccredited === "no"}
                    onChange={(e) => setIsAccredited(e.target.value as "yes" | "no" | "")}
                    className="w-4 h-4 text-blue-600 border-white/20 focus:ring-blue-500 bg-black/20"
                  />
                  <span className="text-white">No, but I&apos;m working towards accreditation</span>
                </label>
              </div>
            </div>

            {isAccredited === "yes" && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">Accredited by:</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accreditedBy.includes("UFS")}
                      onChange={(e) => handleAccreditationChange("UFS", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-white/20 rounded focus:ring-blue-500 bg-black/20"
                    />
                    <span className="text-white">University of the Free State (UFS)</span>
                  </label>
                  <label className="flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accreditedBy.includes("CUT")}
                      onChange={(e) => handleAccreditationChange("CUT", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-white/20 rounded focus:ring-blue-500 bg-black/20"
                    />
                    <span className="text-white">Central University of Technology (CUT)</span>
                  </label>
                </div>
              </div>
            )}

            {isAccredited === "yes" && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">Upload Documents (1-2 files) *</label>
                <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-xl rounded-xl p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
                    <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-neutral-300 mb-4">
                    Upload accreditation certificates, business registration, or other relevant documents
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 cursor-pointer"
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
                        <span className="text-sm text-neutral-300">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">
                {isPending ? "Creating Account..." : "Create Provider Account"}
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
