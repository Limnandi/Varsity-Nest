"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { User, Settings, Heart, LogOut, ChevronDown } from "lucide-react"
import { useUser } from "@stackframe/stack"
import Image from "next/image"
import { useStudentAuth } from "@/hooks/useStudentAuth"

interface StudentProfileDropdownProps {
  onClose?: () => void
}

export default function StudentProfileDropdown({ onClose }: StudentProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const user = useUser() as any
  const { user: studentUser, logout } = useStudentAuth()

  // Helper function to render profile avatar
  const renderProfileAvatar = (size: "sm" | "lg" = "sm") => {
    const sizeClasses = size === "lg" ? "w-12 h-12 text-lg" : "w-10 h-10 text-sm"
    const displayName = studentUser?.name || user?.displayName || user?.primaryEmail || 'Student'
    const initial = displayName.charAt(0).toUpperCase()

    if (studentUser?.profileImageUrl) {
      return (
        <div className={`${sizeClasses} rounded-full relative overflow-hidden`}>
          <Image
            src={studentUser.profileImageUrl}
            alt={`${displayName}'s profile`}
            fill
            className="object-cover"
            sizes={size === "lg" ? "48px" : "40px"}
          />
        </div>
      )
    }

    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg`}>
        {initial}
      </div>
    )
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleLogout = async () => {
    await logout()
  }

  const menuItems = [
    {
      icon: User,
      label: "Profile",
      href: "/student/profile",
      description: "Manage your profile"
    },
    {
      icon: Settings,
      label: "Settings", 
      href: "/student/settings",
      description: "Account preferences"
    },
    {
      icon: Heart,
      label: "Wishlist",
      href: "/student/wishlist", 
      description: "Saved accommodations"
    }
  ]

  return (
    <>
      <div className="relative">
        {/* Profile Button */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 p-2 rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group"
        >
          {/* Profile Avatar */}
          <div className="relative">
            {renderProfileAvatar("sm")}
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
          </div>
          
          {/* User Info */}
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
              {studentUser?.name || user?.displayName || user?.primaryEmail || 'Student'}
            </p>
            <p className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
              Student Account
            </p>
          </div>
          
          {/* Dropdown Arrow */}
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 text-white rounded-2xl shadow-2xl shadow-blue-500/25 border border-white/20 animate-in slide-in-from-top-2 duration-300 z-50 bg-black/40 supports-[backdrop-filter]:bg-black/30 backdrop-blur-[20px] backdrop-saturate-200"
          >
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              {renderProfileAvatar("lg")}
              <div>
                <p className="font-semibold text-white">
                  {studentUser?.name || user?.displayName || user?.primaryEmail || 'Student'}
                </p>
                <p className="text-sm text-neutral-400">
                  {studentUser?.email || user?.primaryEmail || 'student@university.ac.za'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setIsOpen(false)
                  onClose?.()
                }}
                className="group flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:text-blue-300 transition-all duration-300 font-medium rounded-xl relative overflow-hidden"
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 text-neutral-400 group-hover:text-blue-400 transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                </div>
                <div className="flex-1">
                  <p className="text-white group-hover:text-blue-300 transition-colors">{item.label}</p>
                  <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">{item.description}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            ))}
          </div>

          {/* Logout Button */}
          <div className="p-2 border-t border-white/10">
            <button
              onClick={() => {
                setIsOpen(false)
                onClose?.()
                handleLogout()
              }}
              className="group w-full flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-yellow-500/10 hover:text-orange-300 transition-all duration-300 font-medium rounded-xl relative overflow-hidden"
            >
              <div className="relative">
                <LogOut className="w-5 h-5 text-neutral-400 group-hover:text-orange-400 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white group-hover:text-orange-300 transition-colors">Logout</p>
                <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">Sign out of your account</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </div>
        </div>
        )}
      </div>
    </>
  )
}
