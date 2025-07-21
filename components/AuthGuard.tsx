"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "./LoadingSpinner"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "provider" | "student"
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session")

        if (!response.ok) {
          router.push("/auth/login")
          return
        }

        const session = await response.json()

        if (requiredRole && session.role !== requiredRole) {
          router.push("/unauthorized")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
