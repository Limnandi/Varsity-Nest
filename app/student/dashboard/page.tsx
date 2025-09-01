"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Toaster, toast } from "sonner"
import { useUser } from "@stackframe/stack"
import AuthGuard from "@/components/AuthGuard"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function StudentDashboard() {
  const searchParams = useSearchParams()
  const current = useUser() as any

  useEffect(() => {
    const isNewUser = searchParams.get("new_user") === "true"
    if (isNewUser && current) {
      toast.success(`Welcome, ${current.displayName || current.primaryEmail}! You are now signed in.`)
    }
  }, [searchParams, current])

  return (
    <AuthGuard requiredRole="student" fallback={<LoadingSpinner /> }>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to your Dashboard, {current?.displayName || current?.primaryEmail}!</h1>
            <p className="text-gray-600 mt-2">Here you can manage your profile, view saved accommodations, and more.</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
