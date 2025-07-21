import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Layout from "@/components/Layout"
import { Toaster } from "@/components/ui/toaster"
import GoogleAnalytics from "@/components/GoogleAnalytics"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Varsity Nest | Student Accommodation Platform",
    template: "%s | Varsity Nest",
  },
  description:
    "Find quality, verified student accommodation in Bloemfontein. Safe, comfortable, and close to UFS and CUT campuses. Browse accredited properties with 24/7 support.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      {gaId && <GoogleAnalytics gaId={gaId} />}
      <body className={inter.className}>
        <Layout>{children}</Layout>
        <Toaster />
      </body>
    </html>
  )
}
