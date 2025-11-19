import type { Metadata, Viewport } from "next"
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
import ConsoleSecurityWarning from "@/components/ConsoleSecurityWarning"
import CookieBanner from "@/components/CookieBanner"
import { Toaster } from "sonner"

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
  title: "Varsity Nest",
  description: "Off-Campus Living Made Simple",
  icons: {
    icon: [
      { url: "/favicon.ico", rel: "icon", type: "image/x-icon" },
    ],
    apple: [
      { url: "/favicon.ico" },
    ],
    shortcut: [
      { url: "/favicon.ico" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden w-full max-w-full">
      <body className={`${inter.className} overflow-x-hidden w-full max-w-full`}>
        <ConsoleSecurityWarning />
        <CookieBanner />
        <ErrorBoundary component="root_layout">
          <StackProvider app={getStackServerApp() as any}>
            <ReactQueryProvider>
              <TooltipProvider>
                <div className="overflow-x-hidden w-full max-w-full">
                  <Layout>
                    {children}
                    <SpeedInsights />
                    <Analytics />
                    <Toaster richColors position="top-center" />
                  </Layout>
                </div>
              </TooltipProvider>
            </ReactQueryProvider>
          </StackProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}