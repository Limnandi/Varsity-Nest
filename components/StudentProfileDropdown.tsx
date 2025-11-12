"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { User, Settings, Heart, LogOut, ChevronDown } from "lucide-react"
import { useUser } from "@stackframe/stack"
import Image from "next/image"
import { useStudentAuth } from "@/hooks/useStudentAuth"

interface StudentProfileDropdownProps {
  onClose?: () => void
  isMobileMenu?: boolean
}

export default function StudentProfileDropdown({ onClose, isMobileMenu = false }: StudentProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
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

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect()
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          })
        }
      }
      
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
    return undefined
  }, [isOpen])

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

  // Mobile menu mode - render as vertical links
  if (isMobileMenu) {
    return (
      <div className="w-full space-y-2">
        {/* Profile Header */}
        <div className="flex items-center space-x-3 px-4 py-3 mb-4 border-b border-white/10">
          <div className="relative">
            {renderProfileAvatar("sm")}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">
              {studentUser?.name || user?.displayName || user?.primaryEmail || 'Student'}
            </p>
            <p className="text-xs text-neutral-400">
              {studentUser?.email || user?.primaryEmail || 'student@university.ac.za'}
            </p>
          </div>
        </div>

        {/* Menu Items as Vertical Links */}
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="block px-4 py-3 text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 font-medium rounded-xl group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center space-x-3">
              <item.icon className="w-5 h-5 text-neutral-400 group-hover:text-blue-400 transition-colors" />
              <span>{item.label}</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </Link>
        ))}

        {/* Logout Link */}
        <button
          onClick={() => {
            onClose?.()
            handleLogout()
          }}
          className="w-full block px-4 py-3 text-white hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-yellow-500/10 transition-all duration-300 font-medium rounded-xl group relative overflow-hidden text-left"
        >
          <span className="relative z-10 flex items-center space-x-3">
            <LogOut className="w-5 h-5 text-neutral-400 group-hover:text-orange-400 transition-colors" />
            <span>Logout</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </button>
      </div>
    )
  }

  // Desktop mode - render as dropdown
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
      </div>

      {/* Dropdown Menu - Rendered outside navbar with fixed positioning */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-[100] w-80 text-white rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-300 bg-black/20 backdrop-blur-xl overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
          }}
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-blue-500/5 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] bg-[length:24px_24px] opacity-30 pointer-events-none"></div>
          
          {/* Content wrapper with relative positioning */}
          <div className="relative z-10">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/10 backdrop-blur-sm">
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
                  className="group flex items-center space-x-3 px-4 py-3 hover:bg-white/5 hover:text-blue-300 transition-all duration-300 font-medium rounded-xl relative overflow-hidden"
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5 text-neutral-400 group-hover:text-blue-400 transition-colors z-10 relative" />
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
                className="group w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 hover:text-orange-300 transition-all duration-300 font-medium rounded-xl relative overflow-hidden"
              >
                <div className="relative">
                  <LogOut className="w-5 h-5 text-neutral-400 group-hover:text-orange-400 transition-colors z-10 relative" />
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
        </div>
      )}
    </>
  )
}
