"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)
  const [transitionClass, setTransitionClass] = useState('')
  const [isInitialMount, setIsInitialMount] = useState(true)

  useEffect(() => {
    // Skip transition on initial mount
    if (isInitialMount) {
      setIsInitialMount(false)
      prevPathnameRef.current = pathname
      return
    }

    // Determine transition direction based on route change
    const prevPath = prevPathnameRef.current
    const isRegisterPage = pathname.startsWith('/auth/register/')
    const isFromRegisterSelection = prevPath === '/auth/register'
    
    if (pathname === '/auth/register' && prevPath === '/auth/login') {
      // Moving from login to register: slide in from right
      setTransitionClass('slide-in-right')
    } else if (pathname === '/auth/login' && prevPath === '/auth/register') {
      // Moving from register to login: slide in from left
      setTransitionClass('slide-in-left')
    } else if (isRegisterPage && isFromRegisterSelection) {
      // Moving from register selection to specific registration page: fade in
      setTransitionClass('fade-in')
    } else if (pathname !== prevPath) {
      // Other route changes: fade in
      setTransitionClass('fade-in')
    }
    
    prevPathnameRef.current = pathname
    
    // Reset transition class after animation completes
    const timer = setTimeout(() => {
      setTransitionClass('')
    }, 600)
    
    return () => clearTimeout(timer)
  }, [pathname, isInitialMount])

  return (
    <div className="auth-layout-container">
      {/* Static background that never changes */}
      <div className="auth-background-static">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>
      {/* Animated content wrapper */}
      <div className={`auth-content-wrapper ${transitionClass}`}>
        {children}
      </div>
    </div>
  )
}

