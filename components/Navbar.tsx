"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, Menu, X, LogOut, User, Building, Home, Phone } from "lucide-react"

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [adminSettings, setAdminSettings] = useState({
    showProvisionallyAccredited: true,
    showNonAccredited: true,
  })

  const pathname = usePathname() || ""
  const router = useRouter()
  const isDashboardArea =
    (pathname?.startsWith("/admin") ?? false) ||
    (pathname?.startsWith("/provider") ?? false) ||
    (pathname?.startsWith("/auth") ?? false)

  useEffect(() => {
    // Fetch admin settings from API
    const fetchAdminSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const { settings } = await response.json()
          setAdminSettings({
            showProvisionallyAccredited: settings.show_provisionally_accredited ?? true,
            showNonAccredited: settings.show_non_accredited ?? true,
          })
        }
      } catch (error) {
        console.error('Error fetching admin settings:', error)
        // Fallback to default values
        setAdminSettings({
          showProvisionallyAccredited: true,
          showNonAccredited: true,
        })
      }
    }

    fetchAdminSettings()

    const handleStorageChange = () => {
      fetchAdminSettings()
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
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 animate-pulse"></div>
      
      {/* Subtle animated border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  className="w-10 h-10 object-contain relative z-10"
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
            
            {/* Accommodations Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative flex items-center space-x-2 px-4 py-2 text-white hover:text-blue-300 transition-all duration-300 font-medium rounded-lg group"
              >
                <span className="relative z-10">Accommodations</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''} relative z-10`} />
                <div className="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-black/40 backdrop-blur-2xl text-white rounded-2xl shadow-2xl shadow-blue-500/20 py-4 border border-white/20 animate-in slide-in-from-top-2 duration-300">
                  <Link
                    href="/accommodations/accredited"
                    className="group flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 hover:text-green-300 transition-all duration-300 font-medium rounded-xl mx-2 relative overflow-hidden"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg group-hover:shadow-green-500/50 transition-all duration-300"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                    </div>
                    <span className="relative z-10">Accredited</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Link>
                  {adminSettings.showProvisionallyAccredited && (
                    <Link
                      href="/accommodations/provisionally-accredited"
                      className="group flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-amber-500/10 hover:text-yellow-300 transition-all duration-300 font-medium rounded-xl mx-2 relative overflow-hidden"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="relative">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg group-hover:shadow-yellow-500/50 transition-all duration-300"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                      </div>
                      <span className="relative z-10">Provisionally-Accredited</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Link>
                  )}
                  {adminSettings.showNonAccredited && (
                    <Link
                      href="/accommodations/non-accredited"
                      className="group flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-gray-500/10 hover:to-slate-500/10 hover:text-gray-300 transition-all duration-300 font-medium rounded-xl mx-2 relative overflow-hidden"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="relative">
                        <div className="w-2 h-2 bg-gray-400 rounded-full shadow-lg group-hover:shadow-gray-500/50 transition-all duration-300"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-gray-400 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                      </div>
                      <span className="relative z-10">Non-Accredited</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-slate-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="relative px-4 py-2 text-white hover:text-blue-300 transition-all duration-300 font-medium rounded-lg group"
            >
              <span className="relative z-10">Contact</span>
              <div className="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
            </Link>
          </div>

          {/* Right side - Auth Buttons / User Menu */}
          <div className="flex items-center space-x-3">
            {/* Basic navigation buttons */}
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300 font-medium group relative overflow-hidden"
            >
              <span className="relative z-10">Sign In</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
            <Link
              href="/auth/register"
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </Link>

            {/* Mobile menu button */}
            <button
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
              <Link
                href="/"
                className="block px-4 py-3 text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 font-medium rounded-xl mx-2 group relative overflow-hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="relative z-10">Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
              
              <div className="px-4 py-2">
                <p className="text-white font-medium mb-3 text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Accommodations</p>
                <div className="space-y-2 ml-4">
                  <Link
                    href="/accommodations/accredited"
                    className="group flex items-center py-2 text-neutral-300 hover:text-green-300 transition-all duration-300 relative overflow-hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="relative mr-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full group-hover:shadow-green-500/50 transition-all duration-300"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                    </div>
                    <span className="relative z-10">Accredited</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Link>
                  {adminSettings.showProvisionallyAccredited && (
                    <Link
                      href="/accommodations/provisionally-accredited"
                      className="group flex items-center py-2 text-neutral-300 hover:text-yellow-300 transition-all duration-300 relative overflow-hidden"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="relative mr-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full group-hover:shadow-yellow-500/50 transition-all duration-300"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                      </div>
                      <span className="relative z-10">Provisionally-Accredited</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Link>
                  )}
                  {adminSettings.showNonAccredited && (
                    <Link
                      href="/accommodations/non-accredited"
                      className="group flex items-center py-2 text-neutral-300 hover:text-gray-300 transition-all duration-300 relative overflow-hidden"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="relative mr-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full group-hover:shadow-gray-500/50 transition-all duration-300"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-gray-400 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                      </div>
                      <span className="relative z-10">Non-Accredited</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-slate-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Link>
                  )}
                </div>
              </div>
              
              <Link
                href="/contact"
                className="block px-4 py-3 text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 font-medium rounded-xl mx-2 group relative overflow-hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="relative z-10">Contact</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}