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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return null
}
