"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { getCurrentUser } from "@/lib/stackauth"
import type { SessionUser } from "@/lib/stackauth"
import { fetchAccommodationsByProvider } from "@/lib/repos/accommodations"
import { Plus, Edit, Eye, Trash2, MapPin, Users, Star } from "lucide-react"
import Link from "next/link"
import { Building } from "lucide-react" // Import Building component
import { formatZar } from "@/lib/utils"

export default function ProviderAccommodations() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [userAccommodations, setUserAccommodations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser) // TODO: fix this
      if (currentUser) {
        const accs = await fetchAccommodationsByProvider(currentUser.id, 200)
        setUserAccommodations(accs)
      }
      setIsLoading(false)
    }
    loadUser()
  }, [])

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this accommodation?")) return
    try {
      const res = await fetch(`/api/accommodations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setUserAccommodations((prev) => prev.filter((acc) => acc.id !== id))
    } catch (e) {
      alert('Failed to delete accommodation')
    }
  }

  const handleToggleFeatured = async (id: string | number, next: boolean) => {
    try {
      const res = await fetch(`/api/accommodations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: next })
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setUserAccommodations((prev) => prev.map((a) => (a.id === id ? { ...a, featured: updated.featured } : a)))
    } catch (e) {
      alert('Failed to update featured flag')
    }
  }

  const handleUpdateRooms = async (id: string | number, available: number, total: number) => {
    try {
      const res = await fetch(`/api/accommodations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available_rooms: available, total_rooms: total })
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setUserAccommodations((prev) => prev.map((a) => (a.id === id ? { ...a, available_rooms: updated.available_rooms, total_rooms: updated.total_rooms } : a)))
    } catch (e) {
      alert('Failed to update rooms')
    }
  }

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Accommodations</h1>
              <p className="text-gray-600">Manage your property listings</p>
            </div>
            <Link
              href="/provider/accommodations/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add New</span>
            </Link>
          </div>

          {/* Accommodations Grid */}
          {userAccommodations.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accommodations yet</h3>
              <p className="text-gray-600 mb-6">Start by adding your first property listing</p>
              <Link
                href="/provider/accommodations/new"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Property</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userAccommodations.map((accommodation) => (
                <div key={accommodation.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="relative h-48">
                    <img src={(accommodation.images && accommodation.images[0]) || "/placeholder.svg"} alt="Property" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          accommodation.is_open ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {accommodation.is_open ? "Available" : "Full"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{accommodation.name}</h3>

                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{accommodation.address}</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <Users className="w-4 h-4 mr-1" />
                      <span>
                        {accommodation.available_rooms ?? 0}/{accommodation.total_rooms ?? 0} rooms available
                      </span>
                    </div>

                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < (accommodation.rating ?? 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">({accommodation.review_count ?? 0} reviews)</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-green-600">{formatZar(Number(accommodation.price) || 0)}</span>
                      <span className="text-gray-500">/month</span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={Boolean(accommodation.featured)} onChange={(e) => handleToggleFeatured(accommodation.id, e.target.checked)} />
                        Featured
                      </label>
                      <div className="flex items-center gap-2 text-sm">
                        <input type="number" className="w-20 border rounded px-2 py-1" defaultValue={accommodation.available_rooms ?? 0} onBlur={(e) => handleUpdateRooms(accommodation.id, Number(e.target.value) || 0, Number(accommodation.total_rooms) || 0)} />
                        /
                        <input type="number" className="w-20 border rounded px-2 py-1" defaultValue={accommodation.total_rooms ?? 0} onBlur={(e) => handleUpdateRooms(accommodation.id, Number(accommodation.available_rooms) || 0, Number(e.target.value) || 0)} />
                        rooms
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/listing/${accommodation.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Link>
                      <Link
                        href={`/provider/accommodations/edit/${accommodation.id}`}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center flex items-center justify-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(accommodation.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
