"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@stackframe/stack'
import LoadingSpinner from './LoadingSpinner'

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
  const user = useUser({ or: 'return-null' }) as any
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      setAuthorized(false)
      router.push('/auth/login')
      return
    }

    const role = user?.serverMetadata?.role || user?.clientMetadata?.role || user?.clientReadOnlyMetadata?.role
    if (requiredRole && role !== requiredRole) {
      setAuthorized(false)
      router.push('/unauthorized')
      return
    }

    setAuthorized(true)
  }, [requiredRole, user, router])

  if (!authorized) return fallback || <LoadingSpinner />

  return <>{children}</>
}
