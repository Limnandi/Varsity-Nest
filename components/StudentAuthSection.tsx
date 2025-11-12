"use client"

import { useStudentAuth } from "@/hooks/useStudentAuth"
import StudentProfileDropdown from "./StudentProfileDropdown"
import Link from "next/link"
import { LogIn, UserPlus } from "lucide-react"

interface StudentAuthSectionProps {
  onNavigate?: () => void
  isMobileMenu?: boolean
}

export default function StudentAuthSection({ onNavigate, isMobileMenu = false }: StudentAuthSectionProps = {}) {
  const { isAuthenticated: isStudentAuthenticated, isLoading: isStudentLoading } = useStudentAuth()

  if (isStudentLoading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
        <div className="hidden sm:block">
          <div className="w-24 h-4 bg-white/20 rounded animate-pulse"></div>
          <div className="w-32 h-3 bg-white/10 rounded animate-pulse mt-1"></div>
        </div>
      </div>
    )
  }

  if (isStudentAuthenticated) {
    return (
      <>
        {/* Profile dropdown toggles on click for all viewports */}
        <div className="block">
          <StudentProfileDropdown 
            onClose={isMobileMenu ? onNavigate : undefined} 
            isMobileMenu={isMobileMenu}
          />
        </div>
      </>
    )
  }

  // If in mobile menu, render buttons stacked vertically
  if (isMobileMenu) {
    return (
      <div className="flex flex-col space-y-3">
        <Link
          href="/auth/register"
          onClick={onNavigate}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium border border-white/20 w-full"
        >
          <UserPlus className="w-4 h-4" />
          <span>Sign Up</span>
        </Link>
        <Link
          href="/auth/login"
          onClick={onNavigate}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 w-full"
        >
          <LogIn className="w-4 h-4" />
          <span>Login</span>
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Auth Buttons */}
      <div className="hidden lg:flex items-center space-x-3">
        <Link
          href="/auth/register"
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium border border-white/20 hover:border-white/30 hover:scale-105 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Sign Up</span>
        </Link>
        <Link
          href="/auth/login"
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
        >
          <LogIn className="w-4 h-4" />
          <span>Login</span>
        </Link>
      </div>
    </>
  )
}
