"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { LogIn, Menu, UserPlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/accommodations", label: "Accommodations" },
  { href: "/contact", label: "Contact" },
]

export default function NavbarPublic() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className="relative z-40 bg-gradient-to-r from-[#02042b] to-[#040945] backdrop-blur-none md:backdrop-blur-xl border-b border-white/10 shadow-2xl w-full max-w-full">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-2">
                <Image
                  src="/images/varsity-nest-logo.png"
                  alt="Varsity Nest Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <p className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
                  Varsity Nest
                </p>
                <p className="text-xs text-neutral-400">Student Accommodation</p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-white hover:text-blue-300 transition-colors font-medium rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:opacity-90 transition-opacity"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </Link>
            </div>

            <button
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-black/20 backdrop-blur-xl text-white border-l border-white/10",
          "transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl overflow-y-auto",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full p-4 space-y-2">
          <div className="flex gap-2 pb-4 border-b border-white/10">
            <Link
              href="/auth/login"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-white/20 rounded-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </Link>
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
