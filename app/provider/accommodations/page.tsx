"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { getCurrentUser } from "@/lib/stackauth"
import type { User } from "@/lib/definitions"
import { accommodations } from "@/lib/data"
import { Plus, Edit, Eye, Trash2, MapPin, Users, Star } from "lucide-react"
import Link from "next/link"
import { Building } from "lucide-react" // Import Building component
import { formatZar } from "@/lib/utils"

export default function ProviderAccommodations() {
  const [user, setUser] = useState<User | null>(null)
  const [userAccommodations, setUserAccommodations] = useState<typeof accommodations>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setUserAccommodations(
        accommodations.filter((acc) => currentUser?.id.toString() === acc.id.toString().charAt(0))
      )
      setIsLoading(false)
    }
    loadUser()
  }, [])

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this accommodation?")) {
      setUserAccommodations((prev) => prev.filter((acc) => acc.id !== id))
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
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">Property Image</span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          accommodation.isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {accommodation.isOpen ? "Available" : "Full"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{accommodation.title}</h3>

                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{accommodation.address}</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <Users className="w-4 h-4 mr-1" />
                      <span>
                        {accommodation.availableRooms}/{accommodation.totalRooms} rooms available
                      </span>
                    </div>

                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < accommodation.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">({accommodation.reviewCount} reviews)</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-green-600">{formatZar(accommodation.price)}</span>
                      <span className="text-gray-500">/month</span>
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
