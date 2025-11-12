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
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12 flex items-center justify-center">
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/20 p-10 text-center max-w-lg w-full">
        {/* Home Button */}
        <Link 
          href="/" 
          className="absolute top-5 right-5 group p-2.5 border border-white/20 bg-black/20 backdrop-blur-xl rounded-lg hover:bg-white/5 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/20"
        >
          <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        </Link>

        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Join Varsity Nest
          </h1>
          <p className="text-neutral-300 text-base mt-1">Choose your account type to get started</p>
        </div>

        {/* Account Type Selection */}
        <div className="space-y-4 mb-8">
          <Link
            href="/auth/register/student"
            className="group relative flex items-center justify-between w-full p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-blue-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 border border-blue-500/50 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 shadow-[0_0_15px_theme(colors.blue.500/30%)]">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">I&apos;m a Student</h2>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">Looking for accommodation</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-300" />
          </Link>

          <Link
            href="/auth/register/provider"
            className="group relative flex items-center justify-between w-full p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-purple-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 border border-purple-500/50 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-all duration-300 shadow-[0_0_15px_theme(colors.purple.500/30%)]">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">I&apos;m a Service Provider</h2>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">Listing accommodation</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all duration-300" />
          </Link>

          <Link
            href="/auth/register/agent"
            className="group relative flex items-center justify-between w-full p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-green-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 border border-green-500/50 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-all duration-300 shadow-[0_0_15px_theme(colors.green.500/30%)]">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors">I&apos;m an Agent</h2>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">Managing accommodations</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-green-400 group-hover:text-green-300 group-hover:translate-x-1 transition-all duration-300" />
          </Link>
        </div>

        {/* Login Link */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-sm text-neutral-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
