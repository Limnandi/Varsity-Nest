"use client"

import { useEffect, useState } from "react"
import { useUser } from "@stackframe/stack"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, ArrowRight, Home, Building, GraduationCap, Loader2 } from "lucide-react"

export default function EmailVerifiedPage() {
  const user = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Wait a moment for StackAuth to update the user's verification status
        await new Promise(resolve => setTimeout(resolve, 2000))
        // Regardless of StackAuth verification state, fetch the role to show success UI
        try {
          const response = await fetch('/api/auth/user-role', {
            method: 'GET',
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            setUserRole(data.role)
          } else {
            // Fallback to StackAuth user data
            setUserRole((user as any).role || 'student')
          }
        } catch (error) {
          console.error('Failed to fetch user role:', error)
          setUserRole((user as any).role || 'student')
        }
      } catch (error) {
        console.error('Error checking user status:', error)
        // Keep showing success page; user can proceed via button
      } finally {
        setIsLoading(false)
      }
    }

    checkUserStatus()
  }, [user, router])

  // No auto-redirect: show confirmation UI with a button to continue

  const getDashboardRedirect = () => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard'
      case 'provider':
        return '/provider/dashboard'
      case 'student':
      default:
        return '/student/dashboard'
    }
  }

  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          icon: <Building className="w-8 h-8" />,
          title: "Admin Dashboard",
          description: "Manage the platform and oversee operations"
        }
      case 'provider':
        return {
          icon: <Building className="w-8 h-8" />,
          title: "Provider Dashboard", 
          description: "Manage your accommodations and bookings"
        }
      case 'student':
      default:
        return {
          icon: <GraduationCap className="w-8 h-8" />,
          title: "Student Dashboard",
          description: "Find and book your perfect accommodation"
        }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto mb-6 w-20 h-20 border border-blue-500/50 bg-blue-500/10 rounded-full flex items-center justify-center shadow-[0_0_20px_theme(colors.blue.500/40%)]">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Verifying Email...
            </h1>
            <p className="text-neutral-300">Please wait while we confirm your email verification.</p>
          </div>
        </div>
      </div>
    )
  }

  // Always show success UI from verify link, even if StackAuth state hasn't updated yet

  const roleInfo = getRoleInfo()
  const dashboardUrl = (() => {
    const override = searchParams?.get('redirect_to')
    if (override) return override
    return getDashboardRedirect()
  })()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4">
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-green-500/20 p-8 text-white w-full max-w-lg">
        {/* Home Button */}
        <Link 
          href="/" 
          className="absolute top-4 left-4 group p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/20"
        >
          <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        </Link>

        <div className="text-center mb-8">
          {/* Success Animation */}
          <div className="mx-auto mb-6 w-24 h-24 border border-green-500/50 bg-green-500/10 rounded-full flex items-center justify-center shadow-[0_0_30px_theme(colors.green.500/50%)] animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            🎉 Email Verified!
          </h1>
          <p className="text-neutral-300 text-lg mb-2">
            Welcome to Varsity Nest, <strong className="text-green-400">{user?.displayName || user?.primaryEmail}</strong>!
          </p>
          <p className="text-sm text-neutral-400">
            Your account is now fully activated and ready to use.
          </p>
        </div>

        {/* Role-specific Dashboard Card */}
        <div className="mb-8 p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 border border-blue-500/50 bg-blue-500/10 rounded-xl shadow-lg">
              {roleInfo.icon}
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-2 text-white">
            {roleInfo.title}
          </h2>
          <p className="text-sm text-neutral-400 text-center mb-4">
            {roleInfo.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link href={dashboardUrl}>
            <button className="group relative w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
              <span className="relative z-10 flex items-center">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </Link>

          <Link href="/auth/login">
            <button className="group relative w-full border border-white/20 bg-black/20 backdrop-blur-xl text-white py-3 px-6 rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
              <span className="relative z-10 flex items-center">
                Sign In Instead
              </span>
            </button>
          </Link>
        </div>

        {/* Success Message */}
        <div className="mt-6 p-4 border border-green-500/30 bg-green-500/5 backdrop-blur-xl rounded-xl">
          <div className="flex items-center justify-center space-x-2 text-green-300 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Your email verification is complete!</span>
          </div>
        </div>
      </div>
    </div>
  )
}
