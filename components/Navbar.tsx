"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Menu, X, LogOut, User, Building, Home, Phone } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

interface SessionUser {
  id: string
  email: string
  name: string
  role: "admin" | "provider" | "student"
}

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [adminSettings, setAdminSettings] = useState({
    showProvisionallyAccredited: true,
    showNonAccredited: true,
  })

  const pathname = usePathname()
  const router = useRouter()
  const isDashboardArea =
    pathname.startsWith("/admin") || pathname.startsWith("/provider") || pathname.startsWith("/auth")

  useEffect(() => {
    // Check if user is logged in
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const sessionData = await response.json()
          setUser(sessionData)
        }
      } catch (error) {
        console.error("Session check failed:", error)
      }
    }

    checkSession()

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
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getDashboardLink = () => {
    if (!user) return "/"

    switch (user.role) {
      case "admin":
        return "/admin/dashboard"
      case "provider":
        return "/provider/dashboard"
      default:
        return "/"
    }
  }

  return (
    <nav className="relative z-40 bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left side - Logo and Text */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image
                src="/images/varsity-nest-logo.png"
                alt="Varsity Nest Logo"
                width={48}
                height={48}
                className="object-contain group-hover:scale-105 transition-transform duration-200"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Varsity Nest
              </div>
              <div className="text-sm text-gray-200 font-medium">Student Accommodation</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/10 hover:text-blue-300 transition-all duration-300 font-medium text-white/90 backdrop-blur-sm"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* Only show accommodations dropdown on public pages */}
            {!isDashboardArea && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/10 hover:text-blue-300 transition-all duration-300 font-medium text-white/90 backdrop-blur-sm"
                >
                  <Building className="w-4 h-4" />
                  <span>Accommodations</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
            )}

            <Link 
              href="/contact" 
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/10 hover:text-blue-300 transition-all duration-300 font-medium text-white/90 backdrop-blur-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Contact</span>
            </Link>

            {/* User Menu or Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/10 hover:text-blue-300 transition-all duration-300 font-medium text-white/90 backdrop-blur-sm"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span>{user.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-3 w-56 bg-black/40 backdrop-blur-2xl text-white rounded-2xl shadow-2xl py-4 border border-white/20">
                    <Link
                      href={getDashboardLink()}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl mx-2"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 font-medium rounded-xl mx-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !isDashboardArea && (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-white/90 hover:text-blue-300 transition-all duration-300 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-xl transition-all duration-300 font-medium shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 backdrop-blur-sm border border-white/20"
                  >
                    Join as Provider
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-white/90" /> : <Menu className="w-6 h-6 text-white/90" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/40 backdrop-blur-2xl border-t border-white/20">
            <div className="px-4 py-4 space-y-2">
              <Link
                href="/"
                className="flex items-center space-x-3 px-3 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              {/* Only show accommodation links on public pages */}
              {!isDashboardArea && (
                <>
                  <Link
                    href="/accommodations/accredited"
                    className="flex items-center space-x-3 px-3 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg"></div>
                    <span>Accredited</span>
                  </Link>
                  {adminSettings.showProvisionallyAccredited && (
                    <Link
                      href="/accommodations/provisionally-accredited"
                      className="flex items-center space-x-3 px-3 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg"></div>
                      <span>Provisionally-Accredited</span>
                    </Link>
                  )}
                  {adminSettings.showNonAccredited && (
                    <Link
                      href="/accommodations/non-accredited"
                      className="flex items-center space-x-3 px-3 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-2 h-2 bg-gray-400 rounded-full shadow-lg"></div>
                      <span>Non-Accredited</span>
                    </Link>
                  )}
                </>
              )}

              <Link
                href="/contact"
                className="flex items-center space-x-3 px-3 py-3 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 font-medium rounded-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Phone className="w-4 h-4" />
                <span>Contact</span>
              </Link>

              {/* Mobile User Menu or Auth Buttons */}
              {user ? (
                <div className="pt-3 border-t border-white/20 space-y-2">
                  <div className="text-sm text-white/70 px-3">Signed in as {user.name}</div>
                  <Link
                    href={getDashboardLink()}
                    className="block bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium text-center backdrop-blur-sm border border-white/20"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full bg-red-500/80 hover:bg-red-500 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium text-center backdrop-blur-sm border border-white/20"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                !isDashboardArea && (
                  <div className="pt-3 border-t border-white/20 space-y-2">
                    <Link
                      href="/auth/login"
                      className="block text-center px-4 py-3 text-white/90 hover:text-blue-300 transition-all duration-200 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium text-center backdrop-blur-sm border border-white/20"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Join as Provider
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}