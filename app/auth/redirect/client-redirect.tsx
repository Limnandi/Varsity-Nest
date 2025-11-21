"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ClientRedirect() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Get current user session from secure API
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        
        if (response.ok) {
          const result = await response.json()
          
          // Check if response has the expected structure
          if (!result.success || !result.data) {
            setError("Invalid session response")
            router.push('/auth/login')
            return
          }
          
          const userSession = result.data
          console.log(`Secure session found: ${userSession.role} for ${userSession.email}`)
          
          // Redirect based on role
          switch (userSession.role) {
            case 'admin':
              router.push('/admin/dashboard')
              return
            case 'provider':
              router.push('/provider/dashboard')
              return
            case 'agent':
              router.push('/agent/dashboard')
              return
            case 'student':
            default:
              router.push('/student/dashboard')
              return
          }
        } else {
          // No valid session found
          setError("No valid session found")
          router.push('/auth/login')
        }
        
      } catch (error) {
        console.error("Redirect error:", error)
        setError("Authentication error")
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    handleRedirect()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] flex items-center justify-center">
        <div className="text-center">
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">Redirecting...</p>
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
