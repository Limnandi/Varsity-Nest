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
      <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
              Welcome to your Dashboard, {current?.displayName || current?.primaryEmail}!
            </h1>
            <p className="text-neutral-300 text-lg">Here you can manage your profile, view saved accommodations, and more.</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
