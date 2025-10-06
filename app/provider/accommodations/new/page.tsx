"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { MapPin, Building, DollarSign, Users, Wifi, Shield, Car, Utensils, Bus } from "lucide-react"

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
    { id: "shuttle", label: "Shuttle Service", icon: Bus },
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
      const form = new FormData()
      form.append("title", formData.title)
      form.append("address", formData.address)
      form.append("area", formData.area)
      form.append("price", formData.price)
      form.append("total_rooms", formData.totalRooms)
      form.append("description", formData.description)
      form.append("distance", formData.distance)
      form.append("amenities", JSON.stringify(formData.amenities))
      formData.images.forEach((file) => form.append("images", file))

      const res = await fetch("/api/accommodations", {
        method: "POST",
        body: form,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add accommodation")
      }

      router.push("/provider/accommodations")
    } catch (error) {
      alert((error as Error).message || "Failed to add accommodation. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] pt-20 pb-20">
          <div className="max-w-4xl mx-auto px-4 space-y-8">
            {/* Header */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Add New Accommodation
              </h1>
              <p className="text-xl text-neutral-300">Create a new property listing for students</p>
            </div>

            {/* Pricing Info */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-green-500/20">
              <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                Pricing Information
              </h3>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-300 text-lg">
                  <strong>Accredited Accommodations:</strong> First property R150/month, additional properties R50/month each
                </p>
              </div>
            </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-purple-500/20">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <Building className="w-6 h-6 text-purple-400" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Property Name *</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-neutral-400"
                      placeholder="e.g., Sunny Side Residence"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Area *</label>
                  <select
                    required
                    value={formData.area}
                    onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  >
                    <option value="Universitas">Universitas</option>
                    <option value="Brandwag">Brandwag</option>
                    <option value="Willows">Willows</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Full Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="e.g., 123 University Road, Universitas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Monthly Rent (R) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-neutral-400"
                      placeholder="3500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Total Rooms *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      value={formData.totalRooms}
                      onChange={(e) => setFormData((prev) => ({ ...prev, totalRooms: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-neutral-400"
                      placeholder="20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Distance from Campus</label>
                  <input
                    type="text"
                    value={formData.distance}
                    onChange={(e) => setFormData((prev) => ({ ...prev, distance: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="e.g., 0.5km from UFS"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
                <Building className="w-6 h-6 text-blue-400" />
                Description
              </h2>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400 resize-none"
                placeholder="Describe your accommodation, its features, and what makes it special..."
              />
            </div>

            {/* Amenities */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-orange-500/20">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-3">
                <Wifi className="w-6 h-6 text-orange-400" />
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableAmenities.map((amenity) => (
                  <label key={amenity.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="w-4 h-4 text-orange-600 border-white/30 rounded focus:ring-orange-500 bg-black/30"
                    />
                    <amenity.icon className="w-5 h-5 text-neutral-300" />
                    <span className="text-sm text-neutral-300">{amenity.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-pink-500/20">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                <Building className="w-6 h-6 text-pink-400" />
                Images
              </h2>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center bg-black/20">
                <div className="space-y-4">
                  <Building className="w-16 h-16 text-neutral-400 mx-auto" />
                  <p className="text-xl text-neutral-300">Upload property images</p>
                  <p className="text-sm text-neutral-400">PNG, JPG up to 10MB each</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="images"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      const MAX_FILES = 10
                      const MAX_SIZE = 10 * 1024 * 1024
                      const ALLOWED = ['image/jpeg','image/png','image/webp']
                      if (files.length > MAX_FILES) {
                        alert(`Max ${MAX_FILES} images allowed`)
                        return
                      }
                      for (const f of files) {
                        if (!ALLOWED.includes(f.type)) {
                          alert('Only JPEG, PNG, WEBP images allowed')
                          return
                        }
                        if (f.size > MAX_SIZE) {
                          alert('Each image must be <= 10MB')
                          return
                        }
                      }
                      setFormData((prev) => ({ ...prev, images: files }))
                    }}
                  />
                  <label
                    htmlFor="images"
                    className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-semibold"
                  >
                    Choose Files
                  </label>
                </div>
              </div>
              {formData.images.length > 0 && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-sm text-green-300 font-medium">{formData.images.length} files selected</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg shadow-gray-500/20 hover:shadow-gray-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
