"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { 
  Building, 
  Bell, 
  Shield, 
  CreditCard, 
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface ProviderSettings {
  // Accommodation settings
  autoApproveBookings: boolean
  allowInstantBooking: boolean
  requireDeposit: boolean
  depositPercentage: number
  
  // Notification settings
  emailNotifications: boolean
  smsNotifications: boolean
  bookingAlerts: boolean
  paymentAlerts: boolean
  maintenanceAlerts: boolean
  
  // Privacy settings
  showContactInfo: boolean
  allowDirectContact: boolean
  showAvailability: boolean
  
  // Billing settings
  autoRenewal: boolean
  billingReminders: boolean
  invoiceEmail: string
  
  // Security settings
  twoFactorAuth: boolean
  sessionTimeout: number
  loginAlerts: boolean
}

export default function ProviderSettings() {
  const [settings, setSettings] = useState<ProviderSettings>({
    autoApproveBookings: false,
    allowInstantBooking: true,
    requireDeposit: true,
    depositPercentage: 20,
    emailNotifications: true,
    smsNotifications: false,
    bookingAlerts: true,
    paymentAlerts: true,
    maintenanceAlerts: true,
    showContactInfo: true,
    allowDirectContact: true,
    showAvailability: true,
    autoRenewal: true,
    billingReminders: true,
    invoiceEmail: '',
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/provider/settings', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data.settings || settings)
    } catch (err) {
      console.error('Settings fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveStatus('idle')
      setError(null)

      const response = await fetch('/api/provider/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Settings save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingChange = (key: keyof ProviderSettings, value: boolean | number | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="provider">
        <DashboardLayout userRole="provider">
          <div className="space-y-8 p-6">
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20 animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-gray-800 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="space-y-8 p-6 text-white">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-neutral-300 text-lg">Manage your account and accommodation preferences</p>
              </div>
              <div className="flex items-center gap-3">
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Saved successfully</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Save failed</span>
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="relative border border-red-500/30 bg-red-500/10 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-red-500/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="font-semibold text-red-300">Error</h3>
                  <p className="text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Accommodation Settings */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 border border-blue-500/50 bg-blue-500/10 rounded-xl">
                  <Building className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Accommodation Settings
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Auto-approve bookings</h3>
                    <p className="text-sm text-neutral-400">Automatically approve new bookings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoApproveBookings}
                      onChange={(e) => handleSettingChange('autoApproveBookings', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Allow instant booking</h3>
                    <p className="text-sm text-neutral-400">Enable instant booking for available rooms</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowInstantBooking}
                      onChange={(e) => handleSettingChange('allowInstantBooking', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Require deposit</h3>
                    <p className="text-sm text-neutral-400">Require a deposit for bookings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireDeposit}
                      onChange={(e) => handleSettingChange('requireDeposit', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.requireDeposit && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Deposit percentage
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.depositPercentage}
                        onChange={(e) => handleSettingChange('depositPercentage', parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-neutral-400">%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-purple-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 border border-purple-500/50 bg-purple-500/10 rounded-xl">
                  <Bell className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Notifications
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Email notifications</h3>
                    <p className="text-sm text-neutral-400">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Booking alerts</h3>
                    <p className="text-sm text-neutral-400">Get notified of new bookings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.bookingAlerts}
                      onChange={(e) => handleSettingChange('bookingAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Payment alerts</h3>
                    <p className="text-sm text-neutral-400">Get notified of payments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentAlerts}
                      onChange={(e) => handleSettingChange('paymentAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Maintenance alerts</h3>
                    <p className="text-sm text-neutral-400">Get notified of maintenance issues</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceAlerts}
                      onChange={(e) => handleSettingChange('maintenanceAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-green-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 border border-green-500/50 bg-green-500/10 rounded-xl">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  Privacy & Security
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Show contact information</h3>
                    <p className="text-sm text-neutral-400">Display your contact details to students</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showContactInfo}
                      onChange={(e) => handleSettingChange('showContactInfo', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Allow direct contact</h3>
                    <p className="text-sm text-neutral-400">Allow students to contact you directly</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowDirectContact}
                      onChange={(e) => handleSettingChange('allowDirectContact', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Show availability</h3>
                    <p className="text-sm text-neutral-400">Display room availability to students</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showAvailability}
                      onChange={(e) => handleSettingChange('showAvailability', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Two-factor authentication</h3>
                    <p className="text-sm text-neutral-400">Add extra security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Billing Settings */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-orange-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 border border-orange-500/50 bg-orange-500/10 rounded-xl">
                  <CreditCard className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  Billing & Payments
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Auto-renewal</h3>
                    <p className="text-sm text-neutral-400">Automatically renew your subscription</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoRenewal}
                      onChange={(e) => handleSettingChange('autoRenewal', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Billing reminders</h3>
                    <p className="text-sm text-neutral-400">Get reminded about upcoming payments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.billingReminders}
                      onChange={(e) => handleSettingChange('billingReminders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Invoice email address
                  </label>
                  <input
                    type="email"
                    value={settings.invoiceEmail}
                    onChange={(e) => handleSettingChange('invoiceEmail', e.target.value)}
                    placeholder="billing@yourcompany.com"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Session timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value) || 30)}
                    className="w-24 px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
