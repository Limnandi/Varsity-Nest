"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Toaster, toast } from "sonner"
import { useUser } from "@stackframe/stack"
import AuthGuard from "@/components/AuthGuard"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function StudentDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = useUser() as any

  useEffect(() => {
    const isNewUser = searchParams?.get("new_user") === "true"
    if (isNewUser && current) {
      toast.success(`Welcome, ${current.displayName || current.primaryEmail}! You are now signed in.`)
    }
    
    // Redirect to profile page (new contextual experience)
    router.replace('/student/profile')
  }, [searchParams, current, router])

  return (
    <AuthGuard requiredRole="student" fallback={<LoadingSpinner /> }>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] flex items-center justify-center">
        <div className="text-white text-xl">Redirecting to your profile...</div>
      </div>
    </AuthGuard>
  )
}
