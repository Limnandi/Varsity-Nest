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
    cardImage: null as File | null,
    accreditationStatus: "accredited" as "accredited" | "provisionally_accredited" | "non_accredited",
    hasSingleRooms: false,
    hasSharingRooms: false,
    singleRoomPrice: "",
    sharingRoomPrice: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    city: "",
    province: "",
    postalCode: "",
    accommodationType: "",
    maxOccupancy: "",
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
    
    // Validate room types
    if (!formData.hasSingleRooms && !formData.hasSharingRooms) {
      alert("Please select at least one room type (Single or Sharing)")
      return
    }
    // Require exactly 10 images (excluding the card image handled separately)
    if (formData.images.length !== 10) {
      alert("Please upload exactly 10 images for the property (excluding the card picture)")
      return
    }
    
    // Validate pricing for selected room types
    if (formData.hasSingleRooms && (!formData.singleRoomPrice || Number(formData.singleRoomPrice) <= 0)) {
      alert("Please enter a valid price for single rooms")
      return
    }
    
    if (formData.hasSharingRooms && (!formData.sharingRoomPrice || Number(formData.sharingRoomPrice) <= 0)) {
      alert("Please enter a valid price for sharing rooms")
      return
    }
    
    setIsLoading(true)

    try {
      // Upload images to Cloudinary using signed uploads
      const uploadWithSignature = async (file: File) => {
        const signRes = await fetch('/api/cloudinary/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: 'varsity-nest/accommodations' }) })
        if (!signRes.ok) throw new Error('Failed to sign upload')
        const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json()
        const uploadForm = new FormData()
        uploadForm.append('file', file)
        uploadForm.append('api_key', apiKey)
        uploadForm.append('timestamp', String(timestamp))
        uploadForm.append('folder', folder)
        uploadForm.append('signature', signature)
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: uploadForm })
        if (!uploadRes.ok) throw new Error('Cloudinary upload failed')
        const data = await uploadRes.json()
        return data.secure_url as string
      }

      // Ensure the accommodation card image is first
      const orderedFiles: File[] = []
      if (formData.cardImage) orderedFiles.push(formData.cardImage)
      for (const f of formData.images) {
        if (!formData.cardImage || f !== formData.cardImage) orderedFiles.push(f)
      }

      const uploadedUrls: string[] = []
      for (const f of orderedFiles) {
        const url = await uploadWithSignature(f)
        uploadedUrls.push(url)
      }

      const res = await fetch("/api/accommodations", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.title,
          address: formData.address,
          area: formData.area,
          price: Number(formData.price),
          total_rooms: Number(formData.totalRooms),
          description: formData.description,
          distance: formData.distance ? Number(formData.distance) : undefined,
          amenities: formData.amenities,
          accreditation_status: formData.accreditationStatus,
          has_single_rooms: formData.hasSingleRooms,
          has_sharing_rooms: formData.hasSharingRooms,
          single_room_price: formData.singleRoomPrice ? Number(formData.singleRoomPrice) : 0,
          sharing_room_price: formData.sharingRoomPrice ? Number(formData.sharingRoomPrice) : 0,
          images: uploadedUrls,
          contact_email: formData.contactEmail || undefined,
          contact_phone: formData.contactPhone || undefined,
          website_url: formData.websiteUrl || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          postal_code: formData.postalCode || undefined,
          accommodation_type: formData.accommodationType || undefined,
          max_occupancy: formData.maxOccupancy ? Number(formData.maxOccupancy) : undefined,
        })
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
                  <strong>Accredited Accommodations:</strong> First property R450/month, additional properties R50/month each
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

            {/* Accreditation Status */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-yellow-500/20">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <Shield className="w-6 h-6 text-yellow-400" />
                Accreditation Status
              </h2>
              <div className="space-y-4">
                <p className="text-neutral-300 text-lg">Select the accreditation status for your accommodation:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <input
                      type="radio"
                      name="accreditationStatus"
                      value="accredited"
                      checked={formData.accreditationStatus === "accredited"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accreditationStatus: e.target.value as any }))}
                      className="w-4 h-4 text-yellow-600 border-white/30 rounded focus:ring-yellow-500 bg-black/30"
                    />
                    <div>
                      <div className="font-semibold text-green-400">Accredited</div>
                      <div className="text-sm text-neutral-400">Fully accredited by UFS</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <input
                      type="radio"
                      name="accreditationStatus"
                      value="non_accredited"
                      checked={formData.accreditationStatus === "non_accredited"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accreditationStatus: e.target.value as any }))}
                      className="w-4 h-4 text-yellow-600 border-white/30 rounded focus:ring-yellow-500 bg-black/30"
                    />
                    <div>
                      <div className="font-semibold text-red-400">Non-Accredited</div>
                      <div className="text-sm text-neutral-400">Not accredited by UFS</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Room Types & Pricing */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-indigo-500/20">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                <Users className="w-6 h-6 text-indigo-400" />
                Room Types & Pricing
              </h2>
              <div className="space-y-6">
                <p className="text-neutral-300 text-lg">Select which room types you offer and set pricing for each:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <input
                        type="checkbox"
                        checked={formData.hasSingleRooms}
                        onChange={(e) => setFormData((prev) => ({ ...prev, hasSingleRooms: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 border-white/30 rounded focus:ring-indigo-500 bg-black/30"
                      />
                      <div>
                        <div className="font-semibold text-indigo-400">Single Rooms</div>
                        <div className="text-sm text-neutral-400">Private rooms for one person</div>
                      </div>
                    </label>
                    {formData.hasSingleRooms && (
                      <div className="ml-7">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Single Room Price (R/month)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                          <input
                            type="number"
                            value={formData.singleRoomPrice}
                            onChange={(e) => setFormData((prev) => ({ ...prev, singleRoomPrice: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-neutral-400"
                            placeholder="3500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <input
                        type="checkbox"
                        checked={formData.hasSharingRooms}
                        onChange={(e) => setFormData((prev) => ({ ...prev, hasSharingRooms: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 border-white/30 rounded focus:ring-indigo-500 bg-black/30"
                      />
                      <div>
                        <div className="font-semibold text-indigo-400">Sharing Rooms</div>
                        <div className="text-sm text-neutral-400">Shared rooms for multiple people</div>
                      </div>
                    </label>
                    {formData.hasSharingRooms && (
                      <div className="ml-7">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Sharing Room Price (R/month)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                          <input
                            type="number"
                            value={formData.sharingRoomPrice}
                            onChange={(e) => setFormData((prev) => ({ ...prev, sharingRoomPrice: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-neutral-400"
                            placeholder="2500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!formData.hasSingleRooms && !formData.hasSharingRooms && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-yellow-300 text-sm">
                      Please select at least one room type to continue.
                    </p>
                  </div>
                )}
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

            {/* Contact & Location */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-teal-500/20">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
                Contact & Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="provider@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="+27 82 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, websiteUrl: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="https://yourproperty.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="Bloemfontein"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData((p) => ({ ...p, province: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="Free State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData((p) => ({ ...p, postalCode: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="9301"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Accommodation Type</label>
                  <input
                    type="text"
                    value={formData.accommodationType}
                    onChange={(e) => setFormData((p) => ({ ...p, accommodationType: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="Student residence / Flats"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Max Occupancy</label>
                  <input
                    type="number"
                    value={formData.maxOccupancy}
                    onChange={(e) => setFormData((p) => ({ ...p, maxOccupancy: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="100"
                  />
                </div>
              </div>
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

            {/* Accommodation Card Picture */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-pink-500/20">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                <Building className="w-6 h-6 text-pink-400" />
                Accommodation Card Picture
              </h2>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center bg-black/20">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="card-image"
                  onChange={(e) => {
                    const file = (e.target.files && e.target.files[0]) || null
                    const MAX_SIZE = 10 * 1024 * 1024
                    const ALLOWED = ['image/jpeg','image/png','image/webp']
                    if (file) {
                      if (!ALLOWED.includes(file.type)) { alert('Only JPEG, PNG, WEBP allowed'); return }
                      if (file.size > MAX_SIZE) { alert('Image must be <= 10MB'); return }
                    }
                    setFormData((prev) => ({ ...prev, cardImage: file }))
                  }}
                />
                <label
                  htmlFor="card-image"
                  className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-semibold"
                >
                  Choose Card Image
                </label>
                {formData.cardImage && (
                  <div className="mt-3 inline-flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <span className="text-sm text-neutral-300">{formData.cardImage.name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, cardImage: null }))}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      aria-label="Remove card image"
                    >
                      ×
                    </button>
                  </div>
                )}
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
                  <p className="text-sm text-neutral-400">Exactly 10 images required (PNG, JPG, WEBP, up to 10MB each)</p>
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
                      if (files.length !== MAX_FILES) { alert(`Please select exactly ${MAX_FILES} images`); return }
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
                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-neutral-300 font-medium">{formData.images.length} files selected</p>
                    {formData.images.length !== 10 && (
                      <span className="text-xs text-red-400">Exactly 10 required</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {formData.images.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 bg-black/30 border border-white/10 rounded-lg">
                        <span className="text-sm text-neutral-300 truncate max-w-[75%]" title={file.name}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          aria-label={`Remove ${file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
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
                disabled={isLoading || formData.images.length !== 10}
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
