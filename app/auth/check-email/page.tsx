"use client"

import { useEffect } from "react"
import { useUser } from "@stackframe/stack"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  const user = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()

  // If verification code is present in URL, redirect to verify page
  useEffect(() => {
    const code = searchParams?.get('code')
    if (code) {
      // Redirect to verify page which will process the code and redirect to email-verified
      router.replace(`/auth/verify?code=${encodeURIComponent(code)}`)
      return
    }
  }, [searchParams, router])

  // Check if user is already verified
  useEffect(() => {
    if (user?.primaryEmailVerified) {
      // Redirect to dedicated email verified success page
      const redirectUrl = "/auth/email-verified"
      window.location.href = redirectUrl
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white w-full max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">Access Required</h1>
            <p className="text-neutral-300 text-lg mb-8">Please sign in to access this page.</p>
            <Link href="/auth/login">
              <button className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]">
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4">
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-20 h-20 border border-blue-500/50 bg-blue-500/10 rounded-full flex items-center justify-center shadow-[0_0_20px_theme(colors.blue.500/40%)]">
            <Mail className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">Check Your Email</h1>
          <p className="text-neutral-300 text-lg">
            We&apos;ve sent a verification link to <strong className="text-blue-400">{user.primaryEmail}</strong>
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="text-center text-sm text-neutral-400">
            <p>Click the link in your email to verify your account and complete your registration.</p>
            <p className="mt-2">The link will expire in 30 minutes.</p>
            <p className="mt-2 text-xs text-neutral-500">Email delivery may take a few minutes. Please check your inbox and spam folder.</p>
          </div>

          <div className="space-y-4">
            <Link href="/auth/login">
              <button className="group relative w-full border border-white/20 bg-black/20 backdrop-blur-xl text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
                <span className="relative z-10 flex items-center">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Sign In
                </span>
              </button>
            </Link>
          </div>

          <div className="text-center text-xs text-neutral-500">
            <p>Didn&apos;t receive the email? Check your spam folder or contact support.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
