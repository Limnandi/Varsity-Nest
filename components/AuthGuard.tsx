"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from './LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'provider' | 'student' | 'agent'
  fallback?: React.ReactNode
}

interface UserSession {
  userId: string
  email: string
  firstName: string
  lastName: string
  name: string
  role: 'admin' | 'provider' | 'student' | 'agent'
  phone?: string
  studentNumber?: string
  institution?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  university?: string
  yearOfStudy?: number
  course?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

// Track redirects to prevent multiple redirects
let redirectInProgress = false

export default function AuthGuard({ 
  children, 
  requiredRole, 
  fallback 
}: AuthGuardProps) {
  const [authorized, setAuthorized] = useState(false)
  const [_userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      // Prevent multiple simultaneous redirects
      if (redirectInProgress) {
        return
      }
      
      try {
        // Get user session from secure API with credentials included
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Check if response has the expected structure
          if (!result.success || !result.data) {
            // Retry once if we get an unexpected response (might be a timing issue)
            if (retryCount < 1) {
              setTimeout(() => checkAuth(retryCount + 1), 500)
              return
            }
            if (!redirectInProgress) {
              redirectInProgress = true
              setAuthorized(false)
              setIsLoading(false)
              router.push('/auth/login')
            }
            return
          }
          
          const userSession: UserSession = result.data
          setUserRole(userSession.role)
          
          // Check if user is active
          if (!userSession.isActive) {
            setAuthorized(false)
            setIsLoading(false)
            router.push('/auth/login?error=account-deactivated')
            return
          }
          
          // Check role permissions
          if (requiredRole && userSession.role !== requiredRole) {
            if (!redirectInProgress) {
              redirectInProgress = true
              setAuthorized(false)
              setIsLoading(false)
              router.push('/unauthorized')
            }
            return
          }
          
          setAuthorized(true)
          setIsLoading(false)
          redirectInProgress = false // Reset on success
        } else {
          // If session check fails, retry once (might be a timing issue after redirect)
          if (retryCount < 1 && response.status === 401) {
            setTimeout(() => checkAuth(retryCount + 1), 1000)
            return
          }
          
          // If session check fails, try to get error details
          await response.json().catch(() => ({}))
          if (!redirectInProgress) {
            redirectInProgress = true
            setAuthorized(false)
            setIsLoading(false)
            router.push('/auth/login')
          }
        }
      } catch (error) {
        // Retry once on network errors
        if (retryCount < 1) {
          setTimeout(() => checkAuth(retryCount + 1), 1000)
          return
        }
        if (!redirectInProgress) {
          redirectInProgress = true
          setAuthorized(false)
          setIsLoading(false)
          router.push('/auth/login')
        }
      }
    }

    checkAuth()
  }, [requiredRole, router])

  if (isLoading) return fallback || <LoadingSpinner />
  if (!authorized) return fallback || <LoadingSpinner />

  return <>{children}</>
}
