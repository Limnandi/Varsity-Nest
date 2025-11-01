"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { MapPin, Building, DollarSign, Users, Wifi, Shield, Car, Utensils, Bus, ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface AccommodationData {
  id: string
  name: string
  description: string | null
  address: string
  area: string | null
  price: string | number
  total_rooms: number | null
  available_rooms: number | null
  distance: string | number | null
  amenities: string[]
  images: string[]
  accreditation_status: "accredited" | "provisionally_accredited" | "non_accredited"
  has_single_rooms: boolean | null
  has_sharing_rooms: boolean | null
  single_room_price: number | null
  sharing_room_price: number | null
  single_rooms_total?: number | null
  single_rooms_available?: number | null
  sharing_rooms_total?: number | null
  sharing_rooms_available?: number | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  accommodation_type: string | null
  max_occupancy: number | null
}

export default function EditAccommodation() {
  const router = useRouter()
  const params = useParams()
  const accommodationId = params?.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [accommodation, setAccommodation] = useState<AccommodationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    area: "Universitas" as "Universitas" | "Brandwag" | "Willows",
    price: "",
    totalRooms: "",
    description: "",
    distance: "",
    amenities: [] as string[],
    existingCardImage: null as string | null,
    existingImages: [] as string[],
    newCardImage: null as File | null,
    newImages: [] as File[],
    removedCardImage: false,
    removedImageIndices: [] as number[],
    accreditationStatus: "accredited" as "accredited" | "provisionally_accredited" | "non_accredited",
    hasSingleRooms: false,
    hasSharingRooms: false,
    singleRoomPrice: "",
    sharingRoomPrice: "",
    singleRoomsTotal: "",
    singleRoomsAvailable: "",
    sharingRoomsTotal: "",
    sharingRoomsAvailable: "",
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

  useEffect(() => {
    const loadAccommodation = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/accommodations/${accommodationId}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to fetch accommodation')
        }

        const data = await response.json()
        setAccommodation(data)

        const images = Array.isArray(data.images) ? data.images : []
        const cardImageUrl = data.card_image_url || (images.length > 0 ? images[0] : null)
        const propertyImages = images.length > 0 && cardImageUrl === images[0] ? images.slice(1) : images
        
        setFormData({
          title: data.name || "",
          address: data.address || "",
          area: (data.area as "Universitas" | "Brandwag" | "Willows") || "Universitas",
          price: String(data.price || data.price_per_month || ""),
          totalRooms: String(data.total_rooms || ""),
          description: data.description || "",
          distance: data.distance ? String(data.distance) : "",
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
          existingCardImage: cardImageUrl,
          existingImages: propertyImages,
          newCardImage: null,
          newImages: [],
          removedCardImage: false,
          removedImageIndices: [],
          accreditationStatus: data.accreditation_status || data.accreditationStatus || "accredited",
          hasSingleRooms: data.has_single_rooms || false,
          hasSharingRooms: data.has_sharing_rooms || false,
          singleRoomPrice: data.single_room_price ? String(data.single_room_price) : "",
          sharingRoomPrice: data.sharing_room_price ? String(data.sharing_room_price) : "",
          singleRoomsTotal: data.single_rooms_total ? String(data.single_rooms_total) : "",
          singleRoomsAvailable: data.single_rooms_available ? String(data.single_rooms_available) : "",
          sharingRoomsTotal: data.sharing_rooms_total ? String(data.sharing_rooms_total) : "",
          sharingRoomsAvailable: data.sharing_rooms_available ? String(data.sharing_rooms_available) : "",
          contactEmail: data.contact_email || data.contactEmail || "",
          contactPhone: data.contact_phone || data.contactPhone || "",
          websiteUrl: data.website_url || data.websiteUrl || "",
          city: data.city || "",
          province: data.province || "",
          postalCode: data.postal_code || data.postalCode || "",
          accommodationType: data.accommodation_type || data.accommodationType || "",
          maxOccupancy: data.max_occupancy || data.maxOccupancy ? String(data.max_occupancy || data.maxOccupancy) : "",
        })
      } catch (err) {
        console.error('Error loading accommodation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load accommodation')
      } finally {
        setIsLoading(false)
      }
    }

    if (accommodationId) {
      loadAccommodation()
    }
  }, [accommodationId])

  const handleAmenityToggle = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }))
  }

  const handleRemoveExistingImage = (index: number) => {
    const remainingImages = formData.existingImages.length - formData.removedImageIndices.length - 1
    const newImages = formData.newImages.length
    
    if (remainingImages + newImages < 10) {
      alert("Accommodations must have exactly 10 property images (excluding the card image).")
      return
    }

    setFormData((prev) => ({
      ...prev,
      removedImageIndices: [...prev.removedImageIndices, index]
    }))
  }

  const handleRemoveNewImage = (index: number) => {
    const remainingExisting = formData.existingImages.length - formData.removedImageIndices.length
    const remainingNew = formData.newImages.length - 1
    
    if (remainingExisting + remainingNew < 10) {
      alert("Accommodations must have exactly 10 property images (excluding the card image).")
      return
    }

    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index)
    }))
  }

  const handleRemoveCardImage = () => {
    if (!formData.newCardImage && formData.removedCardImage) {
      alert("Accommodations must have a card image. Please upload a new one before removing the existing one.")
      return
    }
    
    setFormData((prev) => ({
      ...prev,
      removedCardImage: !prev.newCardImage
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const remainingExisting = formData.existingImages.length - formData.removedImageIndices.length
    const newImagesCount = formData.newImages.length
    const totalPropertyImages = remainingExisting + newImagesCount
    
    if (totalPropertyImages !== 10) {
      alert("Accommodations must have exactly 10 property images (excluding the card image).")
      return
    }

    const hasCardImage = (formData.existingCardImage && !formData.removedCardImage) || formData.newCardImage
    if (!hasCardImage) {
      alert("Accommodations must have a card image.")
      return
    }

    if (!formData.hasSingleRooms && !formData.hasSharingRooms) {
      alert("Please select at least one room type (Single or Sharing)")
      return
    }

    if (formData.hasSingleRooms && (!formData.singleRoomPrice || Number(formData.singleRoomPrice) <= 0)) {
      alert("Please enter a valid price for single rooms")
      return
    }
    
    if (formData.hasSharingRooms && (!formData.sharingRoomPrice || Number(formData.sharingRoomPrice) <= 0)) {
      alert("Please enter a valid price for sharing rooms")
      return
    }

    // Validate room counts for single rooms
    if (formData.hasSingleRooms) {
      const singleTotal = Number(formData.singleRoomsTotal) || 0
      const singleAvailable = Number(formData.singleRoomsAvailable) || 0
      if (singleTotal <= 0) {
        alert("Please enter the total number of single rooms")
        return
      }
      if (singleAvailable < 0 || singleAvailable > singleTotal) {
        alert("Available single rooms must be between 0 and the total number of single rooms")
        return
      }
    }

    // Validate room counts for sharing rooms
    if (formData.hasSharingRooms) {
      const sharingTotal = Number(formData.sharingRoomsTotal) || 0
      const sharingAvailable = Number(formData.sharingRoomsAvailable) || 0
      if (sharingTotal <= 0) {
        alert("Please enter the total number of sharing rooms")
        return
      }
      if (sharingAvailable < 0 || sharingAvailable > sharingTotal) {
        alert("Available sharing rooms must be between 0 and the total number of sharing rooms")
        return
      }
    }

    // Validate that room type totals match overall total
    const singleTotal = formData.hasSingleRooms ? Number(formData.singleRoomsTotal) || 0 : 0
    const sharingTotal = formData.hasSharingRooms ? Number(formData.sharingRoomsTotal) || 0 : 0
    const overallTotal = Number(formData.totalRooms) || 0
    
    if (singleTotal + sharingTotal !== overallTotal) {
      alert(`The sum of single rooms (${singleTotal}) and sharing rooms (${sharingTotal}) must equal the total rooms (${overallTotal})`)
      return
    }

    const singleAvailable = formData.hasSingleRooms ? Number(formData.singleRoomsAvailable) || 0 : 0
    const sharingAvailable = formData.hasSharingRooms ? Number(formData.sharingRoomsAvailable) || 0 : 0
    const overallAvailable = singleAvailable + sharingAvailable
    
    if (overallAvailable > overallTotal) {
      alert("The sum of available rooms cannot exceed the total number of rooms")
      return
    }
    
    setIsSaving(true)
    setError(null)

    try {
      const uploadWithSignature = async (file: File) => {
        const signRes = await fetch('/api/cloudinary/sign', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ folder: 'varsity-nest/accommodations' }) 
        })
        if (!signRes.ok) throw new Error('Failed to sign upload')
        const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json()
        const uploadForm = new FormData()
        uploadForm.append('file', file)
        uploadForm.append('api_key', apiKey)
        uploadForm.append('timestamp', String(timestamp))
        uploadForm.append('folder', folder)
        uploadForm.append('signature', signature)
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { 
          method: 'POST', 
          body: uploadForm 
        })
        if (!uploadRes.ok) throw new Error('Cloudinary upload failed')
        const data = await uploadRes.json()
        return data.secure_url as string
      }

      let finalCardImageUrl: string
      if (formData.newCardImage) {
        finalCardImageUrl = await uploadWithSignature(formData.newCardImage)
        if (formData.existingCardImage && !formData.removedCardImage) {
          await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ url: formData.existingCardImage })
          }).catch(err => console.warn('Failed to delete old card image:', err))
        }
      } else {
        finalCardImageUrl = formData.existingCardImage || ""
      }

      const existingImagesAfterRemoval = formData.existingImages.filter((_, index) => 
        !formData.removedImageIndices.includes(index)
      )

      // Upload new property images
      const uploadedUrls: string[] = []
      for (const file of formData.newImages) {
        const url = await uploadWithSignature(file)
        uploadedUrls.push(url)
      }

      // Total: 11 images (1 card image + 10 property images)
      // Card image first, then 10 property images
      const finalImages = [finalCardImageUrl, ...existingImagesAfterRemoval, ...uploadedUrls]

        const updatePayload: Record<string, unknown> = {
          name: formData.title,
          address: formData.address,
          area: formData.area,
          price: Number(formData.price),
          total_rooms: Number(formData.totalRooms),
          available_rooms: (formData.hasSingleRooms ? Number(formData.singleRoomsAvailable) || 0 : 0) + (formData.hasSharingRooms ? Number(formData.sharingRoomsAvailable) || 0 : 0),
          description: formData.description,
          distance: formData.distance ? Number(formData.distance) : undefined,
          amenities: formData.amenities,
          images: finalImages,
          card_image_url: finalCardImageUrl,
          accreditation_status: formData.accreditationStatus,
          has_single_rooms: formData.hasSingleRooms,
          has_sharing_rooms: formData.hasSharingRooms,
          single_room_price: formData.singleRoomPrice ? Number(formData.singleRoomPrice) : undefined,
          sharing_room_price: formData.sharingRoomPrice ? Number(formData.sharingRoomPrice) : undefined,
          single_rooms_total: formData.hasSingleRooms ? Number(formData.singleRoomsTotal) : 0,
          single_rooms_available: formData.hasSingleRooms ? Number(formData.singleRoomsAvailable) : 0,
          sharing_rooms_total: formData.hasSharingRooms ? Number(formData.sharingRoomsTotal) : 0,
          sharing_rooms_available: formData.hasSharingRooms ? Number(formData.sharingRoomsAvailable) : 0,
          contact_email: formData.contactEmail || undefined,
          contact_phone: formData.contactPhone || undefined,
          website_url: formData.websiteUrl || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          postal_code: formData.postalCode || undefined,
          accommodation_type: formData.accommodationType || undefined,
          max_occupancy: formData.maxOccupancy ? Number(formData.maxOccupancy) : undefined,
        }

      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined || updatePayload[key] === null || updatePayload[key] === "") {
          delete updatePayload[key]
        }
      })

      const res = await fetch(`/api/accommodations/${accommodationId}`, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatePayload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update accommodation")
      }

      router.push("/provider/accommodations")
    } catch (error) {
      console.error('Update error:', error)
      setError((error as Error).message || "Failed to update accommodation. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="provider">
        <DashboardLayout userRole="provider">
          <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] pt-20 pb-20">
            <div className="max-w-4xl mx-auto px-4">
              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
                <div className="animate-pulse space-y-6">
                  <div className="h-8 bg-gray-700 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-64 bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error && !accommodation) {
    return (
      <AuthGuard requiredRole="provider">
        <DashboardLayout userRole="provider">
          <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] pt-20 pb-20">
            <div className="max-w-4xl mx-auto px-4">
              <div className="relative border border-red-500/30 bg-red-500/10 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-red-500/20">
                <h2 className="text-2xl font-bold mb-4 text-red-300">Error Loading Accommodation</h2>
                <p className="text-red-200 mb-6">{error}</p>
                <Link
                  href="/provider/accommodations"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/20 border border-blue-500/50 text-blue-300 rounded-xl hover:bg-blue-600/30 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Accommodations
                </Link>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!accommodation) {
    return null
  }

  const displayedExistingImages = formData.existingImages.filter((_, index) => 
    !formData.removedImageIndices.includes(index)
  )
  const totalPropertyImages = displayedExistingImages.length + formData.newImages.length
  const hasCardImage = (formData.existingCardImage && !formData.removedCardImage) || formData.newCardImage

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] pt-20 pb-20">
          <div className="max-w-4xl mx-auto px-4 space-y-8">
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
              <div className="flex items-center gap-4 mb-4">
                <Link
                  href="/provider/accommodations"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-neutral-300" />
                </Link>
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Edit Accommodation
                  </h1>
                  <p className="text-xl text-neutral-300">Update your property listing</p>
                </div>
              </div>
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-300">{error}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value as "Universitas" | "Brandwag" | "Willows" }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, accreditationStatus: e.target.value as "accredited" | "provisionally_accredited" | "non_accredited" }))}
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
                        value="provisionally_accredited"
                        checked={formData.accreditationStatus === "provisionally_accredited"}
                        onChange={(e) => setFormData((prev) => ({ ...prev, accreditationStatus: e.target.value as "accredited" | "provisionally_accredited" | "non_accredited" }))}
                        className="w-4 h-4 text-yellow-600 border-white/30 rounded focus:ring-yellow-500 bg-black/30"
                      />
                      <div>
                        <div className="font-semibold text-yellow-400">Provisionally Accredited</div>
                        <div className="text-sm text-neutral-400">Provisional accreditation by UFS</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <input
                        type="radio"
                        name="accreditationStatus"
                        value="non_accredited"
                        checked={formData.accreditationStatus === "non_accredited"}
                        onChange={(e) => setFormData((prev) => ({ ...prev, accreditationStatus: e.target.value as "accredited" | "provisionally_accredited" | "non_accredited" }))}
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

              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-indigo-500/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                  <Users className="w-6 h-6 text-indigo-400" />
                  Room Types & Pricing
                </h2>
                <div className="space-y-6">
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
                        <div className="ml-7 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Single Room Price (R/month) *</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                              <input
                                type="number"
                                required
                                value={formData.singleRoomPrice}
                                onChange={(e) => setFormData((prev) => ({ ...prev, singleRoomPrice: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-neutral-400"
                                placeholder="3500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">Total Single Rooms *</label>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={formData.singleRoomsTotal}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, singleRoomsTotal: e.target.value }))}
                                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-neutral-400"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">Available Single Rooms *</label>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={formData.singleRoomsAvailable}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, singleRoomsAvailable: e.target.value }))}
                                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-neutral-400"
                                  placeholder="0"
                                />
                              </div>
                            </div>
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
                        <div className="ml-7 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Sharing Room Price (R/month) *</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                              <input
                                type="number"
                                required
                                value={formData.sharingRoomPrice}
                                onChange={(e) => setFormData((prev) => ({ ...prev, sharingRoomPrice: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-neutral-400"
                                placeholder="2500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">Total Sharing Rooms *</label>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={formData.sharingRoomsTotal}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, sharingRoomsTotal: e.target.value }))}
                                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-neutral-400"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">Available Sharing Rooms *</label>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={formData.sharingRoomsAvailable}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, sharingRoomsAvailable: e.target.value }))}
                                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-neutral-400"
                                  placeholder="0"
                                />
                              </div>
                            </div>
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

              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-pink-500/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                  <Building className="w-6 h-6 text-pink-400" />
                  Accommodation Card Picture
                </h2>
                <div className="space-y-4">
                  <p className="text-neutral-300 text-sm">
                    This image appears on property cards and listings. It is separate from the property images below.
                  </p>
                  
                  {(formData.existingCardImage && !formData.removedCardImage) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-neutral-300">Current Card Image</p>
                      <div className="relative group w-full max-w-md">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                          <Image
                            src={formData.existingCardImage}
                            alt="Card image"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveCardImage}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove card image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.newCardImage && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-neutral-300">New Card Image</p>
                      <div className="relative group w-full max-w-md">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/30">
                          <Image
                            src={URL.createObjectURL(formData.newCardImage)}
                            alt="New card image"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, newCardImage: null }))}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove new card image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-neutral-400 truncate" title={formData.newCardImage.name}>
                          {formData.newCardImage.name}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center bg-black/20">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="card-image"
                      onChange={(e) => {
                        const file = (e.target.files && e.target.files[0]) || null
                        const MAX_SIZE = 10 * 1024 * 1024
                        const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
                        if (file) {
                          if (!ALLOWED.includes(file.type)) {
                            alert('Only JPEG, PNG, WEBP allowed')
                            return
                          }
                          if (file.size > MAX_SIZE) {
                            alert('Image must be <= 10MB')
                            return
                          }
                        }
                        setFormData((prev) => ({ ...prev, newCardImage: file }))
                      }}
                    />
                    <label
                      htmlFor="card-image"
                      className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-semibold"
                    >
                      {formData.existingCardImage || formData.newCardImage ? "Change Card Image" : "Upload Card Image"}
                    </label>
                    <p className="mt-2 text-sm text-neutral-400">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-pink-500/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                  <Building className="w-6 h-6 text-pink-400" />
                  Property Images
                </h2>
                <div className="space-y-6">
                  <p className="text-neutral-300">
                    Exactly 10 images required (excluding the card image): {totalPropertyImages} ({displayedExistingImages.length} existing, {formData.newImages.length} new)
                  </p>
                  <p className="text-sm text-neutral-400">
                    You can remove existing images or add new ones. You must have exactly 10 property images.
                  </p>

                  {displayedExistingImages.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-neutral-300">Existing Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.existingImages.map((imageUrl, index) => {
                          if (formData.removedImageIndices.includes(index)) return null
                          return (
                            <div key={index} className="relative group">
                              <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                                <Image
                                  src={imageUrl}
                                  alt={`Accommodation image ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExistingImage(index)}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {formData.newImages.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-neutral-300">New Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.newImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/30">
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`New image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveNewImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-neutral-400 truncate" title={file.name}>{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center bg-black/20">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="new-images"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        const MAX_SIZE = 10 * 1024 * 1024
                        const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
                        
                        const remainingExisting = formData.existingImages.length - formData.removedImageIndices.length
                        const currentNew = formData.newImages.length
                        const totalAfter = remainingExisting + currentNew + files.length
                        
                        if (totalAfter > 10) {
                          alert(`You can only add ${10 - (remainingExisting + currentNew)} more images to reach exactly 10 property images.`)
                          return
                        }
                        
                        for (const file of files) {
                          if (!ALLOWED.includes(file.type)) {
                            alert('Only JPEG, PNG, WEBP images allowed')
                            return
                          }
                          if (file.size > MAX_SIZE) {
                            alert('Each image must be <= 10MB')
                            return
                          }
                        }
                        
                        setFormData((prev) => {
                          const remaining = prev.existingImages.length - prev.removedImageIndices.length
                          return { 
                            ...prev, 
                            newImages: [...prev.newImages, ...files].slice(0, 10 - remaining)
                          }
                        })
                      }}
                    />
                    <label
                      htmlFor="new-images"
                      className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-semibold"
                    >
                      Add New Images
                    </label>
                    <p className="mt-2 text-sm text-neutral-400">
                      PNG, JPG, WEBP up to 10MB each
                    </p>
                  </div>

                  {totalPropertyImages !== 10 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-red-300 text-sm">
                        Warning: You must have exactly 10 property images (currently have {totalPropertyImages}). 
                        {totalPropertyImages < 10 && " Please add more images."}
                        {totalPropertyImages > 10 && " Please remove excess images."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

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
                  disabled={isSaving || !hasCardImage || totalPropertyImages !== 10}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Updating Property...
                    </div>
                  ) : (
                    "Update Accommodation"
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

