"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Navbar from "./Navbar"
import Footer from "./Footer"
import FloatingActionButton from "./FloatingActionButton"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()

  // Don't render main layout for dashboard/admin/auth pages
  const isDashboardArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/provider") ||
    pathname.startsWith("/auth") ||
    pathname === "/unauthorized"

  // For dashboard areas, just return children without main layout
  if (isDashboardArea) {
    return <>{children}</>
  }

  // For public pages, render full layout
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/bg.jpg')",
        }}
      />

      {/* Overlay for better text readability */}
      <div className="fixed inset-0 z-0 bg-black bg-opacity-40" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  )
}
