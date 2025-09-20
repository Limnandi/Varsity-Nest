"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Call secure logout API
        const response = await fetch('/api/auth/secure-logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          // Redirect to login page
          router.push('/auth/login?message=logged-out')
        } else {
          setError('Logout failed. Please try again.')
        }
      } catch (error) {
        console.error('Logout error:', error)
        setError('Logout failed. Please try again.')
      } finally {
        setIsLoggingOut(false)
      }
    }

    handleLogout()
  }, [router])

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] flex items-center justify-center">
        <div className="text-center">
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8">
            <LoadingSpinner />
            <p className="text-white text-lg font-medium mt-4">Logging out...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] flex items-center justify-center">
        <div className="text-center">
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8">
            <p className="text-red-400 text-lg mb-6 font-medium">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Go to Login</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}