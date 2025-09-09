"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  LayoutDashboard,
  BarChart2,
  Building,
  Settings,
  LogOut,
  FileText,
  DollarSign,
  GraduationCap,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
// Removed ProductionModeSwitch import

interface DashboardLayoutProps {
  userRole: "admin" | "provider"
  children: React.ReactNode
}

export default function DashboardLayout({ userRole, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true)
    } else {
      setSidebarOpen(false)
    }
  }, [isMobile])

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/admin/providers", label: "Providers", icon: Building },
    { href: "/admin/students", label: "Students", icon: GraduationCap },
    { href: "/admin/domains", label: "Domains", icon: Globe },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  const providerNavItems = [
    { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/provider/accommodations", label: "My Accommodations", icon: Building },
    { href: "/provider/billing", label: "Billing", icon: DollarSign },
    { href: "/provider/settings", label: "Settings", icon: Settings },
  ]

  const navItems = userRole === "admin" ? adminNavItems : providerNavItems

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const pathname = usePathname()
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={() => isMobile && setSidebarOpen(false)}
        className={cn(
          "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105",
          isActive
            ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/50 shadow-lg shadow-blue-500/20"
            : "text-neutral-300 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon className={cn(
          "w-5 h-5 mr-3 transition-colors",
          isActive ? "text-blue-400" : "text-neutral-400 group-hover:text-white"
        )} />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#02042b] to-[#040945]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-black/20 backdrop-blur-xl text-white border-r border-white/10 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Image src="/images/varsity-nest-logo.png" alt="Varsity Nest Logo" width={32} height={32} />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-sm"></div>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Varsity Nest</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-white hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between md:justify-end h-16 px-6 bg-black/20 backdrop-blur-xl border-b border-white/10">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-4">{/* User profile, notifications etc. can go here */}</div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
