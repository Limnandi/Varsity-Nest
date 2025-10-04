import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Layout from "@/components/Layout"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ReactQueryProvider } from "@/lib/query-client"
import { StackProvider } from "@stackframe/stack"
import { getStackServerApp } from "@/lib/stack"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { GlobalErrorHandler } from "@/lib/error-handler"
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { initializeLogging } from "@/lib/logging/config"
import { performanceMonitor } from "@/lib/monitoring/performance"

const inter = Inter({ subsets: ["latin"] })

// Initialize monitoring and logging
if (typeof window !== 'undefined') {
  initializeLogging();
  
  // Report performance metrics every 5 minutes
  setInterval(() => {
    performanceMonitor.reportMetrics();
    performanceMonitor.clearMetrics();
  }, 5 * 60 * 1000);
}

export const metadata: Metadata = {
  title: "Varsity Nest - Student Accommodation",
  description: "Find your perfect student home in Bloemfontein",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize global error handling
  if (typeof window !== 'undefined') {
    GlobalErrorHandler.initialize()
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary component="root_layout">
          <StackProvider app={getStackServerApp() as any}>
            <ReactQueryProvider>
              <TooltipProvider>
                <Layout>
                  {children}
                  <SpeedInsights />
                  <Analytics />
                </Layout>
              </TooltipProvider>
            </ReactQueryProvider>
          </StackProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}