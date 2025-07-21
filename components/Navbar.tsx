"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Menu, X, LogOut, User } from "lucide-react"
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
    <nav className="fixed top-0 left-0 right-0 z-50 h-32 bg-gray-900 bg-opacity-95 backdrop-blur-sm text-white shadow-lg border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left side - Logo and Text */}
        <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
          <div className="relative">
            <Image
              src="/images/varsity-nest-logo.png"
              alt="Varsity Nest Logo"
              width={120}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <div className="text-xl font-bold text-white">Varsity Nest</div>
            <div className="text-lg text-gray-300">Student Accommodation</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="hover:text-teal-400 transition-colors font-medium">
            Home
          </Link>

          {/* Only show accommodations dropdown on public pages */}
          {!isDashboardArea && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 hover:text-teal-400 transition-colors font-medium"
              >
                <span>Accommodations</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white text-gray-900 rounded-lg shadow-xl py-2 border">
                  <Link
                    href="/accommodations/accredited"
                    className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    ✅ Accredited
                  </Link>
                  {adminSettings.showProvisionallyAccredited && (
                    <Link
                      href="/accommodations/provisionally-accredited"
                      className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      ⏳ Provisionally-Accredited
                    </Link>
                  )}
                  {adminSettings.showNonAccredited && (
                    <Link
                      href="/accommodations/non-accredited"
                      className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      💰 Non-Accredited
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          <Link href="/contact" className="hover:text-teal-400 transition-colors font-medium">
            Contact
          </Link>

          {/* User Menu or Auth Buttons */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 hover:text-teal-400 transition-colors font-medium"
              >
                <User className="w-5 h-5" />
                <span>{user.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white text-gray-900 rounded-lg shadow-xl py-2 border">
                  <Link
                    href={getDashboardLink()}
                    className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 hover:text-red-600 transition-colors font-medium flex items-center space-x-2"
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
                  className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="border border-teal-400 hover:bg-teal-400 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors font-medium"
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
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 bg-opacity-95 backdrop-blur-sm border-t border-gray-700">
          <div className="px-6 py-4 space-y-3">
            <Link
              href="/"
              className="block py-2 hover:text-teal-400 transition-colors font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>

            {/* Only show accommodation links on public pages */}
            {!isDashboardArea && (
              <>
                <Link
                  href="/accommodations/accredited"
                  className="block py-2 hover:text-teal-400 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ✅ Accredited
                </Link>
                {adminSettings.showProvisionallyAccredited && (
                  <Link
                    href="/accommodations/provisionally-accredited"
                    className="block py-2 hover:text-teal-400 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ⏳ Provisionally-Accredited
                  </Link>
                )}
                {adminSettings.showNonAccredited && (
                  <Link
                    href="/accommodations/non-accredited"
                    className="block py-2 hover:text-teal-400 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    💰 Non-Accredited
                  </Link>
                )}
              </>
            )}

            <Link
              href="/contact"
              className="block py-2 hover:text-teal-400 transition-colors font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {/* Mobile User Menu or Auth Buttons */}
            {user ? (
              <div className="pt-3 border-t border-gray-700 space-y-2">
                <div className="text-sm text-gray-400">Signed in as {user.name}</div>
                <Link
                  href={getDashboardLink()}
                  className="block bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors font-medium text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors font-medium text-center"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              !isDashboardArea && (
                <div className="pt-3 border-t border-gray-700 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors font-medium text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block border border-teal-400 hover:bg-teal-400 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors font-medium text-center"
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
    </nav>
  )
}
