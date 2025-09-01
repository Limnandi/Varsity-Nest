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
    <nav className="relative z-40 bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left side - Logo and Text */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Varsity Nest Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Varsity Nest
              </h1>
              <p className="text-xs text-gray-300">Student Accommodation</p>
            </div>
          </Link>

          {/* Center - Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="/"
              className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
            >
              Home
            </Link>
            
            {/* Accommodations Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-white hover:text-blue-300 transition-colors duration-200 font-medium"
              >
                <span>Accommodations</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-black/40 backdrop-blur-2xl text-white rounded-2xl shadow-2xl py-4 border border-white/20">
                  <Link
                    href="/accommodations/accredited"
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl mx-2"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg"></div>
                    <span>Accredited</span>
                  </Link>
                  {adminSettings.showProvisionallyAccredited && (
                    <Link
                      href="/accommodations/provisionally-accredited"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl mx-2"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg"></div>
                      <span>Provisionally-Accredited</span>
                    </Link>
                  )}
                  {adminSettings.showNonAccredited && (
                    <Link
                      href="/accommodations/non-accredited"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl mx-2"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="w-2 h-2 bg-gray-400 rounded-full shadow-lg"></div>
                      <span>Non-Accredited</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
            >
              Contact
            </Link>
          </div>

          {/* Right side - Auth Buttons / User Menu */}
          <div className="flex items-center space-x-4">
            {/* Basic navigation buttons */}
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all duration-200 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-black/40 backdrop-blur-2xl border-t border-white/10 py-4">
            <div className="space-y-2">
              <Link
                href="/"
                className="block px-4 py-2 text-white hover:bg-white/10 transition-colors duration-200 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              <div className="px-4 py-2">
                <p className="text-white font-medium mb-2">Accommodations</p>
                <div className="space-y-1 ml-4">
                  <Link
                    href="/accommodations/accredited"
                    className="block py-1 text-gray-300 hover:text-white transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Accredited
                  </Link>
                  {adminSettings.showProvisionallyAccredited && (
                    <Link
                      href="/accommodations/provisionally-accredited"
                      className="block py-1 text-gray-300 hover:text-white transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Provisionally-Accredited
                    </Link>
                  )}
                  {adminSettings.showNonAccredited && (
                    <Link
                      href="/accommodations/non-accredited"
                      className="block py-1 text-gray-300 hover:text-white transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Non-Accredited
                    </Link>
                  )}
                </div>
              </div>
              
              <Link
                href="/contact"
                className="block px-4 py-2 text-white hover:bg-white/10 transition-colors duration-200 font-medium"
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