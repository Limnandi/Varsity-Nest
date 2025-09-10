import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Layout from "@/components/Layout"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StackProvider } from "@stackframe/stack"
import { getStackServerApp } from "@/lib/stack"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { GlobalErrorHandler } from "@/lib/error-handler"

const inter = Inter({ subsets: ["latin"] })

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
            <TooltipProvider>
              <Layout>{children}</Layout>
            </TooltipProvider>
          </StackProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}