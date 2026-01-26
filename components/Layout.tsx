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

  // Define public pages that should show navbar and footer
  const publicPages = [
    "/", // Landing page
    "/accommodations", // Accommodations listing
    "/accommodations/accredited",
    "/accommodations/non-accredited", 
    "/accommodations/provisionally-accredited",
    "/contact", // Contact page
    "/privacy", // Privacy policy
    "/terms", // Terms of service
    "/cookies", // Cookies policy
    "/disclaimer", // Disclaimer
    "/listing", // Individual listing pages
    "/student/profile", // Student profile page
    "/student/settings", // Student settings page
    "/student/wishlist", // Student wishlist page
  ]

  // Check if current page is a public page
  const isPublicPage = publicPages.some(page => 
    pathname === page || pathname.startsWith(page + "/")
  )

  // Don't render main layout for dashboard/admin/auth pages
  const isDashboardArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/provider") ||
    pathname.startsWith("/auth") ||
    pathname === "/unauthorized"

  // For dashboard/auth areas, just return children without main layout
  if (isDashboardArea) {
    return <>{children}</>
  }

  // For public pages, render full layout with navbar and footer
  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-x-hidden w-full max-w-full">
        {/* Dark Professional Background */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          {/* Primary dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#040945] to-[#02042b]" />
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:24px_24px]" />
          </div>
          
          {/* Accent gradients for depth */}
          <div className="hidden sm:block absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl" />
          <div className="hidden sm:block absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-600/10 to-transparent rounded-full blur-3xl" />
          <div className="hidden sm:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-600/10 to-blue-600/10 rounded-full blur-2xl" />
          
          {/* Subtle grid lines */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[length:50px_50px]" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden w-full max-w-full">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-black/80 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-blue-500"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1 overflow-x-hidden w-full max-w-full">
            {children}
          </main>
          <Footer />
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton />
      </div>
    )
  }

  // For all other pages (like API routes, etc.), just return children
  return <>{children}</>
}