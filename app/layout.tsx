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
  metadataBase: new URL('https://varsitynest.space'),
  // Title: Focused on South African terms. (Target: 50-60 chars)
  title: 'Varsity Nest | Find & List Student Housing & Accommodation', 
  
  // Description: Clear value proposition, targeting SA audience and services. (Target: 150-160 chars)
  description: 'Varsity Nest simplifies off-campus living, connecting students with trusted agents and providers to find the best university and college accommodations.',
  
  // Keywords: Helps reinforce relevance to search engines.
  keywords: ['student accommodation south africa', 'off-campus housing', 'varsity res', 'student flats', 'university housing', 'varsity nest', 'ufs', 'cut', 'bloemfontein'], 
  
  // Canonical Tag: Essential for preventing content duplication issues.
  alternates: {
    canonical: 'https://varsitynest.space/', 
  },

  manifest: '/site.webmanifest',

  openGraph: {
    title: 'Varsity Nest | Find & List Student Housing & Accommodation',
    description:
      'Varsity Nest simplifies off-campus living, connecting students with trusted agents and providers to find the best university and college accommodations.',
    url: 'https://varsitynest.space/',
    siteName: 'Varsity Nest',
    locale: 'en_ZA',
    type: 'website',
    images: ['/images/logo.png'],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Varsity Nest | Find & List Student Housing & Accommodation',
    description:
      'Varsity Nest simplifies off-campus living, connecting students with trusted agents and providers to find the best university and college accommodations.',
    images: ['/images/logo.png'],
  },

  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
    shortcut: [{ url: "/icon", type: "image/png", sizes: "512x512" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
