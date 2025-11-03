"use client"

import { useEffect, useState } from "react"
import AuthGuard from "@/components/AuthGuard"
import DashboardLayout from "@/components/DashboardLayout"

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
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Properties</h1>
            <p className="text-neutral-300">Manage all accommodations on the platform</p>
          </div>

          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl text-white">
              <div className="grid grid-cols-12 px-6 py-3 border-b border-white/10 text-neutral-300 text-sm">
              <div className="col-span-6">Property</div>
              <div className="col-span-3">Created</div>
              <div className="col-span-3 text-right">Action</div>
            </div>
            {loading ? (
              <div className="p-6 text-neutral-300">Loading...</div>
            ) : accommodations.length === 0 ? (
              <div className="p-6 text-neutral-300">No properties found.</div>
            ) : (
              <div>
                {accommodations.map((acc) => (
                  <div key={acc.id} className="grid grid-cols-12 px-6 py-4 border-b border-white/5 items-center">
                    <div className="col-span-6 text-white">
                      <div className="font-semibold text-white">{acc.name}</div>
                      {acc.provider_name && (
                        <div className="text-xs text-neutral-400">{acc.provider_name}</div>
                      )}
                    </div>
                    <div className="col-span-3 text-neutral-300">{new Date(acc.created_at).toLocaleString()}</div>
                    <div className="col-span-3 flex justify-end gap-2">
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${acc.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
                        disabled={togglingId === acc.id}
                        onClick={() => toggleActive(acc.id, !acc.is_active)}
                      >
                        {acc.is_active ? 'Suspend' : 'Unsuspend'}
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${acc.is_published ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
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


