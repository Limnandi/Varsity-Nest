"use client"

import { useStudentAuth } from "@/hooks/useStudentAuth"
import StudentProfileDropdown from "./StudentProfileDropdown"
import Link from "next/link"
import { LogIn, User, UserPlus } from "lucide-react"

export default function StudentAuthSection() {
  const { user: studentUser, isAuthenticated: isStudentAuthenticated, isLoading: isStudentLoading } = useStudentAuth()

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
        {/* Desktop Profile Dropdown */}
        <div className="hidden lg:block">
          <StudentProfileDropdown />
        </div>

        {/* Mobile Profile Section */}
        <div className="lg:hidden">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
              {studentUser?.name ? studentUser.name.charAt(0).toUpperCase() : 
               studentUser?.email ? studentUser.email.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">
                {studentUser?.name || studentUser?.email || 'Student'}
              </p>
              <p className="text-xs text-neutral-400">
                {studentUser?.email || 'student@university.ac.za'}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Menu Student Links */}
        <div className="lg:hidden space-y-2">
          <Link
            href="/student/dashboard"
            className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            <User className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </>
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

      {/* Mobile Auth Buttons */}
      <div className="lg:hidden flex items-center space-x-2">
        <Link
          href="/auth/register"
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium border border-white/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Sign Up</span>
        </Link>
        <Link
          href="/auth/login"
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium"
        >
          <LogIn className="w-4 h-4" />
          <span>Login</span>
        </Link>
      </div>
    </>
  )
}
