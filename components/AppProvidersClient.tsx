"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { ReactQueryProvider } from "@/lib/query-client"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { GlobalErrorHandler } from "@/lib/error-handler"
import { performanceMonitor } from "@/lib/monitoring/performance"
import { Toaster } from "sonner"

export default function AppProvidersClient({ children }: { children: ReactNode }) {
  useEffect(() => {
    GlobalErrorHandler.initialize()

    const interval = setInterval(() => {
      performanceMonitor.reportMetrics()
      performanceMonitor.clearMetrics()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <ErrorBoundary component="app_providers">
      <ReactQueryProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-center" />
      </ReactQueryProvider>
    </ErrorBoundary>
  )
}
