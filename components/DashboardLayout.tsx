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
import ProductionModeSwitch from "./ProductionModeSwitch"

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
          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/images/varsity-nest-logo.png" alt="Varsity Nest Logo" width={32} height={32} />
            <span className="font-bold text-lg text-sidebar-primary">Varsity Nest</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <ProductionModeSwitch isProduction={false} />
          <button className="w-full flex items-center mt-4 px-4 py-3 text-sm font-medium rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between md:justify-end h-16 px-6 bg-white dark:bg-gray-800 border-b">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-4">{/* User profile, notifications etc. can go here */}</div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
