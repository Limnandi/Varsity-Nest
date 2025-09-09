"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Menu, X, LogOut, User, Building, Home, Phone } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [adminSettings, setAdminSettings] = useState({
    showProvisionallyAccredited: true,
    showNonAccredited: true,
  })

  const pathname = usePathname()
  const router = useRouter()
  const isDashboardArea =
    pathname.startsWith("/admin") || pathname.startsWith("/provider") || pathname.startsWith("/auth")

  useEffect(() => {
    // Get admin settings
    const settings = {
      showProvisionallyAccredited: true,
      showNonAccredited: true,
    }
    setAdminSettings(settings)

    const handleStorageChange = () => {
      const newSettings = {
        showProvisionallyAccredited: true,
        showNonAccredited: true,
      }
      setAdminSettings(newSettings)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("adminSettingsUpdated", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("adminSettingsUpdated", handleStorageChange)
    }
  }, [])

  const handleLogout = async () => {
    router.push('/auth/logout')
  }

  const getDashboardLink = () => {
    // This function is no longer needed as authentication is removed
    return "/"
  }

  return (
    <nav className="relative z-40 bg-gradient-to-r from-[#02042b] to-[#040945] backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left side - Logo and Text */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image
                src="/images/varsity-nest-logo.png"
                alt="Varsity Nest Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-sm"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Varsity Nest
              </h1>
              <p className="text-xs text-neutral-400">Student Accommodation</p>
            </div>
          </Link>

          {/* Center - Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="/"
              className="text-white hover:text-blue-300 transition-all duration-300 font-medium hover:scale-105"
            >
              Home
            </Link>
            
            {/* Accommodations Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-white hover:text-blue-300 transition-all duration-300 font-medium hover:scale-105"
              >
                <span>Accommodations</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-black/40 backdrop-blur-2xl text-white rounded-2xl shadow-2xl shadow-blue-500/20 py-4 border border-white/20">
                  <Link
                    href="/accommodations/accredited"
                    className="group flex items-center space-x-3 px-4 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-300 font-medium rounded-xl mx-2"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg group-hover:shadow-green-500/50 transition-all duration-300"></div>
                    <span>Accredited</span>
                  </Link>
                  {adminSettings.showProvisionallyAccredited && (
                    <Link
                      href="/accommodations/provisionally-accredited"
                      className="group flex items-center space-x-3 px-4 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-300 font-medium rounded-xl mx-2"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg group-hover:shadow-yellow-500/50 transition-all duration-300"></div>
                      <span>Provisionally-Accredited</span>
                    </Link>
                  )}
                  {adminSettings.showNonAccredited && (
                    <Link
                      href="/accommodations/non-accredited"
                      className="group flex items-center space-x-3 px-4 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-300 font-medium rounded-xl mx-2"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="w-2 h-2 bg-gray-400 rounded-full shadow-lg group-hover:shadow-gray-500/50 transition-all duration-300"></div>
                      <span>Non-Accredited</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="text-white hover:text-blue-300 transition-all duration-300 font-medium hover:scale-105"
            >
              Contact
            </Link>
          </div>

          {/* Right side - Auth Buttons / User Menu */}
          <div className="flex items-center space-x-4">
            {/* Basic navigation buttons */}
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300 font-medium hover:scale-105"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-black/40 backdrop-blur-2xl border-t border-white/10 py-6">
            <div className="space-y-4">
              <Link
                href="/"
                className="block px-4 py-3 text-white hover:bg-white/10 transition-all duration-300 font-medium rounded-xl mx-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              <div className="px-4 py-2">
                <p className="text-white font-medium mb-3 text-lg">Accommodations</p>
                <div className="space-y-2 ml-4">
                  <Link
                    href="/accommodations/accredited"
                    className="group flex items-center py-2 text-neutral-300 hover:text-white transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:shadow-green-500/50 transition-all duration-300"></div>
                    Accredited
                  </Link>
                  {adminSettings.showProvisionallyAccredited && (
                    <Link
                      href="/accommodations/provisionally-accredited"
                      className="group flex items-center py-2 text-neutral-300 hover:text-white transition-all duration-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 group-hover:shadow-yellow-500/50 transition-all duration-300"></div>
                      Provisionally-Accredited
                    </Link>
                  )}
                  {adminSettings.showNonAccredited && (
                    <Link
                      href="/accommodations/non-accredited"
                      className="group flex items-center py-2 text-neutral-300 hover:text-white transition-all duration-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 group-hover:shadow-gray-500/50 transition-all duration-300"></div>
                      Non-Accredited
                    </Link>
                  )}
                </div>
              </div>
              
              <Link
                href="/contact"
                className="block px-4 py-3 text-white hover:bg-white/10 transition-all duration-300 font-medium rounded-xl mx-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}