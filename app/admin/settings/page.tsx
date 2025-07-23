"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { getCurrentUser, updateAdminSettings, getAdminSettings } from "@/lib/auth"
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
      const currentUser = await getCurrentUser()
      if (currentUser?.role === 'admin') {
        setUser(currentUser as AdminUser)
      }

      const dbSettings = await getAdminSettings()
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
      const success = await updateAdminSettings({
        maintenanceMode: settings.maintenanceMode,
        registrationEnabled: settings.registrationEnabled,
        paymentsEnabled: settings.paymentsEnabled
      })

      if (success) {
        setSaveMessage("Core platform settings saved successfully!")
        setTimeout(() => setSaveMessage(""), 3000)
      } else {
        setSaveMessage("Failed to save settings. Please try again.")
      }
    } catch (error) {
      setSaveMessage("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Admin Settings</h1>
                <p className="text-blue-100">Control platform visibility and features</p>
              </div>
            </div>
          </div>

          {/* Navigation Visibility Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Eye className="w-6 h-6 mr-2 text-blue-600" />
              Navigation Visibility
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Provisionally-Accredited Accommodations</h3>
                  <p className="text-sm text-gray-600">
                    Show/hide the "Provisionally-Accredited" option in the navigation dropdown
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("showProvisionallyAccredited")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    settings.showProvisionallyAccredited
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
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

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Non-Accredited Accommodations</h3>
                  <p className="text-sm text-gray-600">
                    Show/hide the "Non-Accredited" option in the navigation dropdown
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("showNonAccredited")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    settings.showNonAccredited
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
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
                  <p className={`text-sm ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                    {saveMessage}
                  </p>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Navigation Preview</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">Current navigation dropdown will show:</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">✅ Accredited (Always visible)</span>
                </div>
                {settings.showProvisionallyAccredited && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span className="text-sm">⏳ Provisionally-Accredited</span>
                  </div>
                )}
                {settings.showNonAccredited && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-sm">💰 Non-Accredited</span>
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
