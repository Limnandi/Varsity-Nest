"use client"

import { useEffect } from "react"
import { useUser } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Home } from "lucide-react"

export default function RegisterPage() {
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

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center relative">
      <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-500/30 p-10 text-center max-w-lg w-full auth-card-container">
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
        <div className="mb-10 relative">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ArrowRight className="w-8 h-8 text-blue-400 rotate-90" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight break-words px-2">
            Join Varsity Nest
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base mt-1 break-words px-2">Choose your account type to get started</p>
        </div>

        {/* Account Type Selection */}
        <div className="space-y-4 mb-8">
          <Link
            href="/auth/register/student"
            className="group relative flex items-center justify-between w-full p-6 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center space-x-4 relative z-10">
              <div className="w-14 h-14 border border-blue-500/50 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 group-hover:border-blue-500/70 transition-all duration-300 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 group-hover:scale-110">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors break-words">I&apos;m a Student</h2>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors break-words">Looking for accommodation</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-blue-400 group-hover:text-blue-300 group-hover:translate-x-2 transition-all duration-300 relative z-10" />
          </Link>

          <Link
            href="/auth/register/provider"
            className="group relative flex items-center justify-between w-full p-6 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center space-x-4 relative z-10">
              <div className="w-14 h-14 border border-purple-500/50 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 group-hover:border-purple-500/70 transition-all duration-300 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 group-hover:scale-110">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors break-words">I&apos;m a Service Provider</h2>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors break-words">Listing accommodation</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-2 transition-all duration-300 relative z-10" />
          </Link>

          <Link
            href="/auth/register/agent"
            className="group relative flex items-center justify-between w-full p-6 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center space-x-4 relative z-10">
              <div className="w-14 h-14 border border-green-500/50 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 group-hover:border-green-500/70 transition-all duration-300 shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 group-hover:scale-110">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors break-words">I&apos;m an Agent</h2>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors break-words">Managing accommodations</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-green-400 group-hover:text-green-300 group-hover:translate-x-2 transition-all duration-300 relative z-10" />
          </Link>
        </div>

        {/* Login Link */}
        <div className="pt-6 border-t border-white/10">
          <p className="text-sm text-neutral-400 break-words px-2">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-all duration-200 break-words hover:underline hover:underline-offset-2 inline-flex items-center gap-1 group/link">
              <span className="inline-block group-hover/link:-translate-x-1 transition-transform duration-200">←</span>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
