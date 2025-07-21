"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { MapPin, Building, DollarSign, Users, Wifi, Shield, Car, Utensils } from "lucide-react"

export default function NewAccommodation() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    area: "Universitas" as "Universitas" | "Brandwag" | "Willows",
    price: "",
    totalRooms: "",
    description: "",
    distance: "",
    amenities: [] as string[],
    images: [] as File[],
  })

  const availableAmenities = [
    { id: "wifi", label: "WiFi", icon: Wifi },
    { id: "security", label: "24/7 Security", icon: Shield },
    { id: "parking", label: "Parking", icon: Car },
    { id: "kitchen", label: "Kitchen", icon: Utensils },
    { id: "laundry", label: "Laundry", icon: Building },
    { id: "gym", label: "Gym", icon: Users },
    { id: "pool", label: "Swimming Pool", icon: Building },
    { id: "study", label: "Study Room", icon: Building },
  ]

  const handleAmenityToggle = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert("Accommodation added successfully!")
      router.push("/provider/accommodations")
    } catch (error) {
      alert("Failed to add accommodation. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Accommodation</h1>
            <p className="text-gray-600">Create a new property listing</p>
          </div>

          {/* Pricing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Pricing Information</h3>
            <p className="text-blue-800 text-sm">
              <strong>Accredited Accommodations:</strong> First property R150/month, additional properties R50/month
              each
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Name *</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Sunny Side Residence"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                  <select
                    required
                    value={formData.area}
                    onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Universitas">Universitas</option>
                    <option value="Brandwag">Brandwag</option>
                    <option value="Willows">Willows</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 123 University Road, Universitas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (R) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="3500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Rooms *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      value={formData.totalRooms}
                      onChange={(e) => setFormData((prev) => ({ ...prev, totalRooms: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance from Campus</label>
                  <input
                    type="text"
                    value={formData.distance}
                    onChange={(e) => setFormData((prev) => ({ ...prev, distance: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 0.5km from UFS"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your accommodation, its features, and what makes it special..."
              />
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableAmenities.map((amenity) => (
                  <label key={amenity.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <amenity.icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{amenity.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Images</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-2">
                  <Building className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600">Upload property images</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="images"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setFormData((prev) => ({ ...prev, images: files }))
                    }}
                  />
                  <label
                    htmlFor="images"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Choose Files
                  </label>
                </div>
              </div>
              {formData.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">{formData.images.length} files selected</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding Property...
                  </div>
                ) : (
                  "Add Accommodation"
                )}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
