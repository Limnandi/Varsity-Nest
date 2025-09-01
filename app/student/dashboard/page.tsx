"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Toaster, toast } from "sonner"
import { getCurrentUser } from "@/lib/stackauth"
import type { User } from "@/lib/definitions"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function StudentDashboard() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const isNewUser = searchParams.get("new_user") === "true"

    async function fetchUser() {
      const sessionUser = await getCurrentUser()
      setUser(sessionUser)
      setIsLoading(false)
      if (isNewUser && sessionUser) {
        toast.success(`Welcome, ${sessionUser.name}! You are now signed in.`)
      }
    }

    fetchUser()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to your Dashboard, {user?.name}!</h1>
            <p className="text-gray-600 mt-2">Here you can manage your profile, view saved accommodations, and more.</p>
          </div>
          {/* Add more student dashboard components here */}
        </div>
      </div>
    </>
  )
}
