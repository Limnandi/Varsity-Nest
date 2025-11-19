"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import ConfirmDialog from "@/components/ConfirmDialog"
import DeletionLoadingOverlay from "@/components/DeletionLoadingOverlay"
import { 
  Building, 
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  Trash2
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
  const [accommodations, setAccommodations] = useState<Array<{
    id: string
    name: string
    address: string
    is_active: boolean
    is_published: boolean
    accreditation_status: string
    available_rooms: number | null
    total_rooms: number | null
  }>>([])
  const [accommodationsLoading, setAccommodationsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletionComplete, setDeletionComplete] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchAccommodations()
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

  const fetchAccommodations = async () => {
    try {
      setAccommodationsLoading(true)
      const response = await fetch('/api/provider/accommodations', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch accommodations')
      }

      const data = await response.json()
      setAccommodations(data.accommodations || [])
    } catch (err) {
      console.error('Accommodations fetch error:', err)
    } finally {
      setAccommodationsLoading(false)
    }
  }

  const handleToggleAccommodationStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/accommodations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !isActive })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update accommodation status')
      }

      const updated = await response.json()
      setAccommodations(prev => prev.map(acc => 
        acc.id === id ? { ...acc, is_active: updated.is_active !== undefined ? updated.is_active : !isActive } : acc
      ))
    } catch (err) {
      console.error('Accommodation status update error:', err)
      alert(err instanceof Error ? err.message : 'Failed to update accommodation status')
    }
  }

  const handleDeleteAccommodation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this accommodation? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/accommodations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to delete accommodation')
      }

      setAccommodations(prev => prev.filter(acc => acc.id !== id))
    } catch (err) {
      console.error('Accommodation deletion error:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete accommodation')
    }
  }

  const handleDeleteAccount = async () => {
    setShowDeleteDialog(false)
    setIsDeleting(true)
    
    try {
      const response = await fetch('/api/provider/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Failed to delete account')
      }

      // Show completion state
      setDeletionComplete(true)

      // Wait a moment before redirecting
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to home
      window.location.href = '/'

    } catch (error) {
      console.error('Account deletion error:', error)
      alert(error instanceof Error ? error.message : "Failed to delete account. Please try again.")
      setIsDeleting(false)
      setDeletionComplete(false)
    }
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
        <div className="space-y-4 sm:space-y-8 p-4 sm:p-6 text-white overflow-x-hidden">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-blue-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">
                  Settings
                </h1>
                <p className="text-neutral-300 text-sm sm:text-lg break-words">Manage your account and accommodation preferences</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
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
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 text-sm sm:text-base break-words"
                >
                  <Save className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isSaving ? 'animate-spin' : ''}`} />
                  <span className="break-words">{isSaving ? 'Saving...' : 'Save Changes'}</span>
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

          {/* Accommodation Management */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-indigo-500/10">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 border border-indigo-500/50 bg-indigo-500/10 rounded-xl flex-shrink-0">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent break-words">
                  Accommodation Management
                </h2>
              </div>

              {accommodationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : accommodations.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No accommodations found</h3>
                  <p className="text-neutral-400 mb-6">You haven&apos;t created any accommodations yet.</p>
                  <a
                    href="/provider/accommodations/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02]"
                  >
                    <Building className="w-4 h-4" />
                    Create Your First Accommodation
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {accommodations.map((accommodation) => (
                    <div key={accommodation.id} className="border border-white/10 bg-black/20 rounded-xl p-4 sm:p-6 hover:bg-black/30 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-white break-words">{accommodation.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              accommodation.is_active 
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {accommodation.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              accommodation.is_published 
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}>
                              {accommodation.is_published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-neutral-400 text-xs sm:text-sm mb-2 break-words">{accommodation.address}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-300">
                            <span className="break-words">Status: {accommodation.accreditation_status?.replace('_', ' ')}</span>
                            <span className="break-words">Rooms: {accommodation.available_rooms || 0}/{accommodation.total_rooms || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleToggleAccommodationStatus(accommodation.id, accommodation.is_active)}
                            className={`p-2 rounded-lg transition-all duration-300 ${
                              accommodation.is_active
                                ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30'
                                : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30'
                            }`}
                            title={accommodation.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {accommodation.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteAccommodation(accommodation.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-all duration-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* Danger Zone - Delete Account */}
        <div className="relative border border-red-500/30 bg-red-950/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-red-500/10 p-6 text-white mt-8">
          <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-red-400" />
            Danger Zone
          </h2>
          
          <div className="space-y-4">
            <p className="text-neutral-300 text-sm">
              Once you delete your account, there is no going back. This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-neutral-400 text-sm space-y-1 ml-4">
              <li>Your provider profile</li>
              <li>All your accommodations and their images</li>
              <li>All bookings and related data</li>
              <li>Your user account</li>
            </ul>
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Are you absolutely sure you want to delete your account? This action cannot be undone and all your data, accommodations, images, and bookings will be permanently deleted."
          confirmText="Yes, Delete My Account"
          cancelText="Cancel"
          isLoading={isDeleting}
          variant="danger"
        />

        {/* Deletion Loading Overlay */}
        <DeletionLoadingOverlay isDeleting={isDeleting} isComplete={deletionComplete} />
      </DashboardLayout>
    </AuthGuard>
  )
}
