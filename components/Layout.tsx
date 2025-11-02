"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Navbar from "./Navbar"
import Footer from "./Footer"
import FloatingActionButton from "./FloatingActionButton"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()

  // Disable right-click and common developer shortcuts globally
  useEffect(() => {
    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Prevent common developer shortcuts
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Disable F12 (Developer Tools)
      if (e.key === "F12") {
        e.preventDefault()
        return
      }

      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault()
        return
      }

      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault()
        return
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault()
        return
      }

      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault()
        return
      }
    }

    // Prevent text selection on common select-all shortcuts
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement
      // Allow selection in input fields and textareas
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return true
      }
      // Prevent selection on other elements
      e.preventDefault()
      return false
    }

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("selectstart", handleSelectStart)

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("selectstart", handleSelectStart)
    }
  }, [])

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
      <div className="min-h-screen flex flex-col relative">
        {/* Dark Professional Background */}
        <div className="fixed inset-0 z-0">
          {/* Primary dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#040945] to-[#02042b]" />
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:24px_24px]" />
          </div>
          
          {/* Accent gradients for depth */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-600/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-600/10 to-blue-600/10 rounded-full blur-2xl" />
          
          {/* Subtle grid lines */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[length:50px_50px]" />
          </div>
        </div>

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

  // For all other pages (like API routes, etc.), just return children
  return <>{children}</>
}