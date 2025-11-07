"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import StudentAuthProvider from "./StudentAuthProvider"
import StudentAuthSection from "./StudentAuthSection"

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [_isUserMenuOpen, _setIsUserMenuOpen] = useState(false)

  return (
    <nav className="relative z-40 bg-gradient-to-r from-[#02042b] to-[#040945] backdrop-blur-xl border-b border-white/10 shadow-2xl w-full max-w-full">
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 animate-pulse"></div>
      
      {/* Subtle animated border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-20">
          {/* Left side - Logo and Text */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative group-hover:scale-110 transition-all duration-300">
              {/* Glowing background effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-md group-hover:blur-lg transition-all duration-300"></div>
              
              {/* Logo container with enhanced styling */}
              <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-2 group-hover:border-white/20 transition-all duration-300">
                <Image
                  src="/images/varsity-nest-logo.png"
                  alt="Varsity Nest Logo"
                  width={40}
                  height={40}
                  className="object-contain relative z-10"
                  style={{ width: 'auto', height: 'auto' }}
                />
                
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>
            </div>
            
            <div className="hidden sm:block group-hover:translate-x-1 transition-transform duration-300">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-blue-400 transition-all duration-300">
                Varsity Nest
              </h1>
              <p className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors duration-300">Student Accommodation</p>
            </div>
          </Link>

          {/* Center - Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              href="/"
              className="relative px-4 py-2 text-white hover:text-blue-300 transition-all duration-300 font-medium rounded-lg group"
            >
              <span className="relative z-10">Home</span>
              <div className="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
            </Link>
            
            {/* Accommodations Link */}
            <Link
              href="/accommodations"
              className="relative px-4 py-2 text-white hover:text-blue-300 transition-all duration-300 font-medium rounded-lg group"
            >
              <span className="relative z-10">Accommodations</span>
              <div className="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
            </Link>

            <Link
              href="/contact"
              className="relative px-4 py-2 text-white hover:text-blue-300 transition-all duration-300 font-medium rounded-lg group"
            >
              <span className="relative z-10">Contact</span>
              <div className="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
            </Link>
          </div>

          {/* Right side - Auth Buttons / Student Profile */}
          <div className="flex items-center space-x-3">
            <StudentAuthProvider>
              {() => (
                <StudentAuthSection />
              )}
            </StudentAuthProvider>

            {/* Mobile menu button */}
            <button
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 text-white hover:bg-white/10 rounded-xl transition-all duration-300 group relative overflow-hidden"
            >
              <div className="relative z-10">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-black/40 backdrop-blur-2xl border-t border-white/10 py-6 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              {/* Student Profile Dropdown (click to open), not a block of links */}
              <div className="px-4 py-3 border-b border-white/10 mb-4">
                <StudentAuthProvider>
                  {() => (
                    <StudentAuthSection onNavigate={() => setIsMobileMenuOpen(false)} />
                  )}
                </StudentAuthProvider>
              </div>

              <Link
                href="/"
                className="block px-4 py-3 text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 font-medium rounded-xl mx-2 group relative overflow-hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="relative z-10">Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
              
              <Link
                href="/accommodations"
                className="block px-4 py-3 text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 font-medium rounded-xl mx-2 group relative overflow-hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="relative z-10">Accommodations</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
              
              <Link
                href="/contact"
                className="block px-4 py-3 text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 font-medium rounded-xl mx-2 group relative overflow-hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="relative z-10">Contact</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>

              {/* Student-specific mobile menu items */}
              <StudentAuthProvider>
                {() => (
                  <div className="px-4 py-2 border-t border-white/10 mt-4">
                    <StudentAuthSection />
                  </div>
                )}
              </StudentAuthProvider>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}