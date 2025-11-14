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
  const guardId = Math.random().toString(36).substring(7)

  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      console.log(`[AUTH GUARD] [${guardId}] Starting auth check - Path: ${currentPath}, Required Role: ${requiredRole}, Retry: ${retryCount}`)
      
      // Prevent multiple simultaneous redirects
      if (redirectInProgress) {
        console.log(`[AUTH GUARD] [${guardId}] Redirect already in progress, skipping check`)
        return
      }
      
      try {
        // Get user session from secure API with credentials included
        console.log(`[AUTH GUARD] Fetching /api/auth/session with credentials...`)
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        console.log(`[AUTH GUARD] Session API response status: ${response.status}, ok: ${response.ok}`)
        
        if (response.ok) {
          const result = await response.json()
          console.log(`[AUTH GUARD] Session API response:`, { success: result.success, hasData: !!result.data, dataKeys: result.data ? Object.keys(result.data) : [] })
          console.log(`[AUTH GUARD] Full API response:`, JSON.stringify(result, null, 2))
          
          // Check if response has the expected structure
          if (!result.success || !result.data) {
            console.warn(`[AUTH GUARD] Invalid session response structure - success: ${result.success}, hasData: ${!!result.data}`)
            // Retry once if we get an unexpected response (might be a timing issue)
            if (retryCount < 1) {
              console.log(`[AUTH GUARD] Retrying auth check in 500ms...`)
              setTimeout(() => checkAuth(retryCount + 1), 500)
              return
            }
            console.error(`[AUTH GUARD] [${guardId}] Auth failed - invalid response structure, redirecting to login`)
            if (!redirectInProgress) {
              redirectInProgress = true
              setAuthorized(false)
              setIsLoading(false)
              router.push('/auth/login')
            }
            return
          }
          
          const userSession: UserSession = result.data
          console.log(`[AUTH GUARD] User session found - Role: "${userSession.role}" (type: ${typeof userSession.role}), Email: ${userSession.email}, Active: ${userSession.isActive}, EmailVerified: ${userSession.emailVerified}`)
          console.log(`[AUTH GUARD] Required role: "${requiredRole}" (type: ${typeof requiredRole})`)
          console.log(`[AUTH GUARD] Role comparison: "${userSession.role}" === "${requiredRole}" = ${userSession.role === requiredRole}`)
          setUserRole(userSession.role)
          
          // Check if user is active
          if (!userSession.isActive) {
            console.warn(`[AUTH GUARD] User account is deactivated, redirecting to login`)
            setAuthorized(false)
            setIsLoading(false)
            router.push('/auth/login?error=account-deactivated')
            return
          }
          
          // Check role permissions
          if (requiredRole && userSession.role !== requiredRole) {
            console.warn(`[AUTH GUARD] [${guardId}] Role mismatch - Required: "${requiredRole}", User has: "${userSession.role}", Types: required=${typeof requiredRole}, user=${typeof userSession.role}, redirecting to /unauthorized`)
            console.warn(`[AUTH GUARD] [${guardId}] Full userSession object:`, JSON.stringify(userSession, null, 2))
            if (!redirectInProgress) {
              redirectInProgress = true
              setAuthorized(false)
              setIsLoading(false)
              router.push('/unauthorized')
            }
            return
          }
          
          console.log(`[AUTH GUARD] [${guardId}] Auth successful - User authorized`)
          setAuthorized(true)
          setIsLoading(false)
          redirectInProgress = false // Reset on success
        } else {
          console.warn(`[AUTH GUARD] Session API returned error status: ${response.status}`)
          // If session check fails, retry once (might be a timing issue after redirect)
          if (retryCount < 1 && response.status === 401) {
            console.log(`[AUTH GUARD] Got 401, retrying auth check in 1000ms...`)
            setTimeout(() => checkAuth(retryCount + 1), 1000)
            return
          }
          
          // If session check fails, try to get error details
          const errorData = await response.json().catch(() => ({}))
          console.error(`[AUTH GUARD] [${guardId}] Session check failed - Status: ${response.status}, Error:`, errorData)
          if (!redirectInProgress) {
            redirectInProgress = true
            setAuthorized(false)
            setIsLoading(false)
            console.log(`[AUTH GUARD] [${guardId}] Redirecting to /auth/login due to failed session check`)
            router.push('/auth/login')
          }
        }
      } catch (error) {
        console.error(`[AUTH GUARD] Exception during auth check:`, error)
        // Retry once on network errors
        if (retryCount < 1) {
          console.log(`[AUTH GUARD] Network error, retrying auth check in 1000ms...`)
          setTimeout(() => checkAuth(retryCount + 1), 1000)
          return
        }
        console.error(`[AUTH GUARD] [${guardId}] Auth check failed after retry:`, error)
        if (!redirectInProgress) {
          redirectInProgress = true
          setAuthorized(false)
          setIsLoading(false)
          console.log(`[AUTH GUARD] [${guardId}] Redirecting to /auth/login due to exception`)
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
