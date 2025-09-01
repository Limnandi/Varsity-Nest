"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@stackframe/stack'
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
  const { user, isAuthenticated, isLoading } = useUser()
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      setAuthorized(false)
      router.push('/auth/login')
      return
    }

    if (requiredRole && (user as any)?.metadata?.role !== requiredRole) {
      setAuthorized(false)
      router.push('/unauthorized')
      return
    }

    setAuthorized(true)
  }, [isLoading, isAuthenticated, requiredRole, user, router])

  if (isLoading) {
    return fallback || <LoadingSpinner />
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
