"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Settings, Bell, Shield, Eye, EyeOff, Save, Key, Mail, Smartphone } from "lucide-react"
import { useStudentAuth } from "@/hooks/useStudentAuth"
import { Toaster, toast } from "sonner"

export default function StudentSettingsPage() {
  const { user: studentUser, isLoading, refetch } = useStudentAuth()
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    profileVisibility: 'public',
    showPhoneNumber: false,
    showStudentNumber: false,
    twoFactorAuth: false
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !studentUser) {
      router.push('/auth/login')
    }
  }, [isLoading, studentUser, router])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/student/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || "Settings updated successfully!")
        await refetch()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update settings")
      }
    } catch (error) {
      console.error('Settings update error:', error)
      toast.error("Failed to update settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || "Password changed successfully!")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to change password")
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error("Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!studentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] p-8">
      <div className="max-w-4xl mx-auto">
        <Toaster richColors position="top-center" />
        
        {/* Header */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-neutral-300">Manage your account preferences and security</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notification Settings */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-white">Email Notifications</p>
                    <p className="text-sm text-neutral-400">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium text-white">SMS Notifications</p>
                    <p className="text-sm text-neutral-400">Receive updates via SMS</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="font-medium text-white">Marketing Emails</p>
                    <p className="text-sm text-neutral-400">Receive promotional content</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.marketingEmails}
                    onChange={(e) => setSettings({...settings, marketingEmails: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Privacy
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-black/20 rounded-xl">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Profile Visibility</label>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => setSettings({...settings, profileVisibility: e.target.value})}
                  className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium text-white">Show Phone Number</p>
                    <p className="text-sm text-neutral-400">Display phone in profile</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showPhoneNumber}
                    onChange={(e) => setSettings({...settings, showPhoneNumber: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium text-white">Show Student Number</p>
                    <p className="text-sm text-neutral-400">Display student number in profile</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showStudentNumber}
                    onChange={(e) => setSettings({...settings, showStudentNumber: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Security
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Change Password */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 pr-12 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 pr-12 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 pr-12 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isSaving ? 'Changing...' : 'Change Password'}</span>
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Two-Factor Authentication</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium text-white">2FA Enabled</p>
                        <p className="text-sm text-neutral-400">Add extra security to your account</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.twoFactorAuth}
                        onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <p className="text-sm text-neutral-400">
                    Two-factor authentication adds an extra layer of security by requiring a second form of verification when you sign in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
