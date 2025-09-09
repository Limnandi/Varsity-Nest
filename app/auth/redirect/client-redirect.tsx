"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStackApp } from "@stackframe/stack"

interface DatabaseSession {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isActive: boolean
    emailVerified: boolean
  }
  authMethod: string
}

export default function ClientRedirect() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const app = useStackApp()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Check for database session first
        const sessionData = localStorage.getItem('varsityNestSession')
        
        if (sessionData) {
          const session: DatabaseSession = JSON.parse(sessionData)
          
          if (session.user && session.user.role) {
            console.log(`Database session found: ${session.user.role} for ${session.user.email}`)
            
            // Redirect based on role
            switch (session.user.role) {
              case 'admin':
                router.push('/admin/dashboard')
                return
              case 'provider':
                router.push('/provider/dashboard')
                return
              case 'student':
              default:
                router.push('/student/dashboard')
                return
            }
          }
        }

        // If no database session, check StackAuth
        try {
          const stackUser = await app.getUser({ or: "return-null" })
          
          if (stackUser?.id) {
            console.log(`StackAuth session found: ${stackUser.primaryEmail}`)
            
            // Get role from database for StackAuth user
            const response = await fetch('/api/auth/get-user-role', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: stackUser.id }),
            })

            if (response.ok) {
              const { role } = await response.json()
              
              switch (role) {
                case 'admin':
                  router.push('/admin/dashboard')
                  return
                case 'provider':
                  router.push('/provider/dashboard')
                  return
                case 'student':
                default:
                  router.push('/student/dashboard')
                  return
              }
            }
          }
        } catch (stackError) {
          console.log("StackAuth check failed:", stackError)
        }

        // No valid session found
        setError("No valid session found")
        router.push('/auth/login')
        
      } catch (error) {
        console.error("Redirect error:", error)
        setError("Authentication error")
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    handleRedirect()
  }, [router, app])

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
