"use client"

import { Suspense } from "react"
import { useStudentAuth } from "@/hooks/useStudentAuth"
import LoadingSpinner from "@/components/LoadingSpinner"

interface StudentAuthProviderProps {
  children: (auth: ReturnType<typeof useStudentAuth>) => React.ReactNode
  fallback?: React.ReactNode
}

function StudentAuthContent({ children }: { children: (auth: ReturnType<typeof useStudentAuth>) => React.ReactNode }) {
  const auth = useStudentAuth()
  return <>{children(auth)}</>
}

export default function StudentAuthProvider({ children, fallback }: StudentAuthProviderProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <StudentAuthContent>
        {children}
      </StudentAuthContent>
    </Suspense>
  )
}
