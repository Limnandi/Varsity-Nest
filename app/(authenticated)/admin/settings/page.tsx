"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
// Removed direct imports of server-side functions - now using API routes
import type { User } from "@/lib/definitions"

interface AdminUser extends User {
  adminSettings: {}
}
import { Settings } from "lucide-react"

export default function AdminSettings() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [_settings, _setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    paymentsEnabled: true
  })
  const [_isSaving, _setIsSaving] = useState(false)
  const [_saveMessage, _setSaveMessage] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch user data from API route
        const userResponse = await fetch('/api/admin/user')
        if (userResponse.ok) {
          const { user } = await userResponse.json()
          if (user?.role === 'admin') {
            setUser(user as AdminUser)
          }
        }

        // Fetch admin settings from API route
        const settingsResponse = await fetch('/api/admin/settings')
        if (settingsResponse.ok) {
          const { settings: dbSettings } = await settingsResponse.json()
          if (dbSettings) {
            _setSettings({
              maintenanceMode: dbSettings.maintenance_mode ?? false,
              registrationEnabled: dbSettings.registration_enabled ?? true,
              paymentsEnabled: dbSettings.payments_enabled ?? true
            })
          }
        }
      } catch (error) {
        console.error('Error loading admin settings:', error)
        // Don't set any user data if there's an error - let AuthGuard handle it
      }
    }
    loadData()
  }, [])

  

  

  if (!user) {
    return (
      <AuthGuard requiredRole="admin">
        <DashboardLayout userRole="admin">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 overflow-x-hidden">
          {/* Header */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 text-white shadow-2xl shadow-blue-500/20">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg flex-shrink-0">
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">Admin Settings</h1>
                <p className="text-neutral-300 text-sm sm:text-base break-words">Control platform visibility and features</p>
              </div>
            </div>
          </div>

          {/* Navigation Visibility Settings removed */}

          {/* Preview section removed */}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
