"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
// Removed direct imports of server-side functions - now using API routes
import type { User } from "@/lib/definitions"

interface AdminUser extends User {
  adminSettings: {
    showProvisionallyAccredited: boolean
    showNonAccredited: boolean
  }
}
import { Settings, Eye, Save, ToggleLeft, ToggleRight } from "lucide-react"

export default function AdminSettings() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    paymentsEnabled: true,
    showProvisionallyAccredited: true,
    showNonAccredited: true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

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
            setSettings({
              maintenanceMode: dbSettings.maintenance_mode ?? false,
              registrationEnabled: dbSettings.registration_enabled ?? true,
              paymentsEnabled: dbSettings.payments_enabled ?? true,
              showProvisionallyAccredited: dbSettings.show_provisionally_accredited ?? true,
              showNonAccredited: dbSettings.show_non_accredited ?? true
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

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage("")

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maintenanceMode: settings.maintenanceMode,
          registrationEnabled: settings.registrationEnabled,
          paymentsEnabled: settings.paymentsEnabled
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSaveMessage("Core platform settings saved successfully!")
        setTimeout(() => setSaveMessage(""), 3000)
      } else {
        setSaveMessage(result.error || "Failed to save settings. Please try again.")
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

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
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg">
                <Settings className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Admin Settings</h1>
                <p className="text-neutral-300">Control platform visibility and features</p>
              </div>
            </div>
          </div>

          {/* Navigation Visibility Settings */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
            <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
              <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg mr-3">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
              Navigation Visibility
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-white/10 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1 text-lg">Provisionally-Accredited Accommodations</h3>
                  <p className="text-sm text-neutral-300">
                    Show/hide the "Provisionally-Accredited" option in the navigation dropdown
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("showProvisionallyAccredited")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                    settings.showProvisionallyAccredited
                      ? "bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                      : "bg-neutral-500/20 text-neutral-400 border border-neutral-500/50 hover:bg-neutral-500/30"
                  }`}
                >
                  {settings.showProvisionallyAccredited ? (
                    <>
                      <ToggleRight className="w-6 h-6" />
                      <span className="font-medium">Visible</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-6 h-6" />
                      <span className="font-medium">Hidden</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-white/10 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1 text-lg">Non-Accredited Accommodations</h3>
                  <p className="text-sm text-neutral-300">
                    Show/hide the "Non-Accredited" option in the navigation dropdown
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("showNonAccredited")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                    settings.showNonAccredited
                      ? "bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                      : "bg-neutral-500/20 text-neutral-400 border border-neutral-500/50 hover:bg-neutral-500/30"
                  }`}
                >
                  {settings.showNonAccredited ? (
                    <>
                      <ToggleRight className="w-6 h-6" />
                      <span className="font-medium">Visible</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-6 h-6" />
                      <span className="font-medium">Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex items-center justify-between">
              <div>
                {saveMessage && (
                  <p className={`text-sm ${saveMessage.includes("success") ? "text-green-400" : "text-red-400"}`}>
                    {saveMessage}
                  </p>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
            <h2 className="text-2xl font-semibold mb-4 text-white">Navigation Preview</h2>
            <div className="border border-white/10 bg-white/5 rounded-lg p-4">
              <p className="text-sm text-neutral-300 mb-3">Current navigation dropdown will show:</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_theme(colors.green.400/50%)]"></span>
                  <span className="text-sm text-white">✅ Accredited (Always visible)</span>
                </div>
                {settings.showProvisionallyAccredited && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_theme(colors.yellow.400/50%)]"></span>
                    <span className="text-sm text-white">⏳ Provisionally-Accredited</span>
                  </div>
                )}
                {settings.showNonAccredited && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_theme(colors.blue.400/50%)]"></span>
                    <span className="text-sm text-white">💰 Non-Accredited</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
