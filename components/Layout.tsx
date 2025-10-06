"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Navbar from "./Navbar"
import Footer from "./Footer"
import FloatingActionButton from "./FloatingActionButton"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [pathname, setPathname] = useState("")
  
  useEffect(() => {
    // Use window.location.pathname as a fallback
    const getPathname = () => {
      if (typeof window !== 'undefined') {
        setPathname(window.location.pathname)
      }
    }
    
    getPathname()
    // Listen for route changes
    window.addEventListener('popstate', getPathname)
    return () => window.removeEventListener('popstate', getPathname)
  }, [])

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
      {/* Dark Professional Background */}
      <div className="fixed inset-0 z-0">
        {/* Primary dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900" />
        
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