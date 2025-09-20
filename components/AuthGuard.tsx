"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from './LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'provider' | 'student'
  fallback?: React.ReactNode
}

interface UserSession {
  userId: string
  email: string
  firstName: string
  lastName: string
  name: string
  role: 'admin' | 'provider' | 'student'
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

export default function AuthGuard({ 
  children, 
  requiredRole, 
  fallback 
}: AuthGuardProps) {
  const [authorized, setAuthorized] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get user session from secure API
        const response = await fetch('/api/auth/session')
        
        if (response.ok) {
          const userSession: UserSession = await response.json()
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
            setAuthorized(false)
            setIsLoading(false)
            router.push('/unauthorized')
            return
          }
          
          setAuthorized(true)
        } else {
          setAuthorized(false)
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthorized(false)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole, router])

  if (isLoading) return fallback || <LoadingSpinner />
  if (!authorized) return fallback || <LoadingSpinner />

  return <>{children}</>
}
