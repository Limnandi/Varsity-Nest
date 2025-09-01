import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Layout from "@/components/Layout"
import { StackProvider } from "@stackframe/stack"
import { getStackClientApp } from "@/lib/stack"

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <StackProvider app={getStackClientApp()}>
          <Layout>{children}</Layout>
        </StackProvider>
      </body>
    </html>
  )
}