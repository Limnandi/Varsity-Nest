"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, SessionUser } from '@/lib/stackauth'
import { LoadingSpinner } from './LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'provider' | 'student'
  fallback?: React.ReactNode
}

export default function AuthGuard({ 
  children, 
  requiredRole, 
  fallback 
}: AuthGuardProps) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession()
        if (session?.user) {
          setUser(session.user)
          
          // Check role authorization
          if (requiredRole && session.user.role !== requiredRole) {
            setAuthorized(false)
            // Redirect unauthorized users
            router.push('/unauthorized')
            return
          }
          
          setAuthorized(true)
        } else {
          setAuthorized(false)
          // Redirect unauthenticated users
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthorized(false)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole, router])

  if (loading) {
    return fallback || <LoadingSpinner />
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
