"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@stackframe/stack'

interface StudentUser {
  id: string
  email: string
  name: string
  university: string
  isVerified: boolean
  createdAt: string
  isBlocked?: boolean
  blockedAt?: string
  blockedReason?: string
  studentNumber?: string
  yearOfStudy?: number
  course?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  phone?: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
}

interface UseStudentAuthReturn {
  user: StudentUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isStudent: boolean
  error: string | null
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

export function useStudentAuth(): UseStudentAuthReturn {
  const [user, setUser] = useState<StudentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const stackUser = useUser() as any

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // First check if we have a StackAuth user
      if (!stackUser) {
        setUser(null)
        return
      }

      const ensureUserKey = stackUser?.id ? `varsity_nest_ensure_user_${stackUser.id}` : null
      const shouldEnsureUser = typeof window === 'undefined'
        ? true
        : ensureUserKey
          ? !sessionStorage.getItem(ensureUserKey)
          : true

      if (shouldEnsureUser) {
        const ensureResponse = await fetch('/api/auth/ensure-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: stackUser.id,
            fullName: stackUser.displayName,
            firstName: stackUser.firstName,
            lastName: stackUser.lastName,
            cellNumber: stackUser.phoneNumber,
            studentNumber: stackUser.studentNumber || 'N/A',
            university: stackUser.primaryEmail?.includes('ufs4life.ac.za') ? 'UFS' : 'CUT'
          })
        })

        if (ensureResponse.ok && typeof window !== 'undefined' && ensureUserKey) {
          sessionStorage.setItem(ensureUserKey, '1')
        }
      }

      // Get detailed user data from our secure session API
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data) {
          const userData = result.data
          
          // Check if this is a student
          if (userData.role !== 'student') {
            setUser(null)
            return
          }

          // Transform the data to match our StudentUser interface
          const studentUser: StudentUser = {
            id: userData.userId,
            email: userData.email,
            name: userData.name,
            university: userData.university || 'UFS',
            isVerified: userData.emailVerified,
            createdAt: userData.createdAt,
            isBlocked: !userData.isActive,
            blockedAt: userData.isActive ? undefined : userData.updatedAt,
            blockedReason: userData.isActive ? undefined : 'Account deactivated',
            studentNumber: userData.studentNumber,
            yearOfStudy: userData.yearOfStudy,
            course: userData.course,
            emergencyContactName: userData.emergencyContactName,
            emergencyContactPhone: userData.emergencyContactPhone,
            phone: userData.phone,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
          }

          setUser(studentUser)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Error fetching student data:', err)
      setError('Failed to load user data')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [stackUser])

  const logout = async () => {
    try {
      // Call secure logout API to clear custom session
      await fetch('/api/auth/secure-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      // Clear StackAuth session using the signOut method
      if (stackUser) {
        await stackUser.signOut()
      }
      
      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: redirect to home page
      window.location.href = '/'
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !user.isBlocked,
    isStudent: !!user && !!user.university && !user.isBlocked,
    error,
    refetch: fetchUserData,
    logout
  }
}
