"use client"

import { useEffect, useState, useMemo } from "react"
import AuthGuard from "@/components/AuthGuard"
import DashboardLayout from "@/components/DashboardLayout"
import { Search } from "lucide-react"

interface AdminAccommodation {
  id: string
  name: string
  created_at: string
  is_active: boolean
  is_published: boolean
  provider_name?: string
}

export default function AdminPropertiesPage() {
  const [accommodations, setAccommodations] = useState<AdminAccommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/accommodations', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setAccommodations(data.accommodations || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filteredAccommodations = useMemo(() => {
    if (!searchTerm.trim()) {
      return accommodations
    }
    const term = searchTerm.toLowerCase()
    return accommodations.filter(
      (acc) =>
        acc.name.toLowerCase().includes(term) ||
        (acc.provider_name && acc.provider_name.toLowerCase().includes(term))
    )
  }, [accommodations, searchTerm])

  const toggleActive = async (id: string, nextActive: boolean) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/admin/accommodations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'toggle-active', id, is_active: nextActive })
      })
      if (res.ok) {
        const updated = await res.json()
        setAccommodations(prev => prev.map(a => a.id === id ? updated.accommodation : a))
      }
    } finally {
      setTogglingId(null)
    }
  }

  const togglePublished = async (id: string, nextPublished: boolean) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/admin/accommodations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'toggle-published', id, is_published: nextPublished })
      })
      if (res.ok) {
        const updated = await res.json()
        setAccommodations(prev => prev.map(a => a.id === id ? updated.accommodation : a))
      }
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 overflow-x-hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">Properties</h1>
            <p className="text-neutral-300 text-sm sm:text-base break-words">Manage all accommodations on the platform</p>
          </div>

          {/* Search Bar */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by property name or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-white/10 bg-black/20 backdrop-blur-xl rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400 min-w-0"
              />
            </div>
            {searchTerm && (
              <div className="mt-3 text-xs sm:text-sm text-neutral-400 break-words">
                Showing {filteredAccommodations.length} of {accommodations.length} properties
              </div>
            )}
          </div>

          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl text-white overflow-hidden">
              <div className="hidden md:grid grid-cols-12 px-4 sm:px-6 py-3 border-b border-white/10 text-neutral-300 text-sm">
              <div className="col-span-6 break-words">Property</div>
              <div className="col-span-3 break-words">Created</div>
              <div className="col-span-3 text-right break-words">Action</div>
            </div>
            {loading ? (
              <div className="p-4 sm:p-6 text-neutral-300 text-sm sm:text-base break-words">Loading...</div>
            ) : filteredAccommodations.length === 0 ? (
              <div className="p-4 sm:p-6 text-neutral-300 text-sm sm:text-base break-words">
                {searchTerm ? `No properties found matching "${searchTerm}".` : "No properties found."}
              </div>
            ) : (
              <div>
                {filteredAccommodations.map((acc) => (
                  <div key={acc.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-0 px-4 sm:px-6 py-4 border-b border-white/5 md:items-center">
                    <div className="md:col-span-6 text-white min-w-0 flex-1">
                      <div className="font-semibold text-white text-sm sm:text-base break-words">{acc.name}</div>
                      {acc.provider_name && (
                        <div className="text-xs text-neutral-400 break-words mt-1">{acc.provider_name}</div>
                      )}
                    </div>
                    <div className="md:col-span-3 text-neutral-300 text-xs sm:text-sm break-words">
                      <span className="md:hidden font-medium text-neutral-400 mr-2">Created:</span>
                      {new Date(acc.created_at).toLocaleString()}
                    </div>
                    <div className="md:col-span-3 flex flex-col sm:flex-row gap-2 md:justify-end min-w-0">
                      <button
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors break-words ${acc.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50 w-full sm:w-auto`}
                        disabled={togglingId === acc.id}
                        onClick={() => toggleActive(acc.id, !acc.is_active)}
                      >
                        {acc.is_active ? 'Suspend' : 'Unsuspend'}
                      </button>
                      <button
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors break-words ${acc.is_published ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 w-full sm:w-auto`}
                        disabled={togglingId === acc.id}
                        onClick={() => togglePublished(acc.id, !acc.is_published)}
                      >
                        {acc.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}


