"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, GraduationCap, Phone, MapPin, Save, Edit3, Heart, Settings, BookOpen } from "lucide-react"
import { useStudentAuth } from "@/hooks/useStudentAuth"
import { Toaster, toast } from "sonner"
import ProfileImageUpload from "@/components/ProfileImageUpload"

export default function StudentProfilePage() {
  const { user: studentUser, isLoading, refetch } = useStudentAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentNumber: "",
    university: "",
    yearOfStudy: "",
    course: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    phone: ""
  })

  // Load user data into form
  useEffect(() => {
    if (studentUser) {
      setFormData({
        name: studentUser.name || "",
        email: studentUser.email || "",
        studentNumber: studentUser.studentNumber || "",
        university: studentUser.university || "",
        yearOfStudy: studentUser.yearOfStudy?.toString() || "",
        course: studentUser.course || "",
        emergencyContactName: studentUser.emergencyContactName || "",
        emergencyContactPhone: studentUser.emergencyContactPhone || "",
        phone: studentUser.phone || ""
      })
    }
  }, [studentUser])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !studentUser) {
      router.push('/auth/login')
    }
  }, [isLoading, studentUser, router])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined,
          course: formData.course,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || "Profile updated successfully!")
        setIsEditing(false)
        await refetch()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update profile")
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    if (studentUser) {
      setFormData({
        name: studentUser.name || "",
        email: studentUser.email || "",
        studentNumber: studentUser.studentNumber || "",
        university: studentUser.university || "",
        yearOfStudy: studentUser.yearOfStudy?.toString() || "",
        course: studentUser.course || "",
        emergencyContactName: studentUser.emergencyContactName || "",
        emergencyContactPhone: studentUser.emergencyContactPhone || "",
        phone: studentUser.phone || ""
      })
    }
    setIsEditing(false)
  }

  const handleImageUpdate = () => {
    // Update the student user data with new image URL
    if (studentUser) {
      // This will trigger a refetch to get updated data
      refetch()
    }
  }

  const handleImageRemove = () => {
    // Update the student user data to remove image
    if (studentUser) {
      // This will trigger a refetch to get updated data
      refetch()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!studentUser) {
    return null
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <Toaster richColors position="top-center" />
        
        {/* Header */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 sm:p-8 text-white mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6">
            <div className="flex items-center space-x-4">
              <ProfileImageUpload
                currentImageUrl={studentUser.profileImageUrl}
                userName={studentUser.name || studentUser.email || 'Student'}
                onImageUpdate={handleImageUpdate}
                onImageRemove={handleImageRemove}
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-neutral-300">Manage your student account information</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Personal Information */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Your full name"
                  />
                ) : (
                  <p className="px-4 py-3 bg-black/20 rounded-xl text-white">{formData.name || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Email Address</label>
                <p className="px-4 py-3 bg-black/20 rounded-xl text-white flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-400" />
                  {formData.email}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Your phone number"
                  />
                ) : (
                  <p className="px-4 py-3 bg-black/20 rounded-xl text-white flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-blue-400" />
                    {formData.phone || 'Not provided'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Academic Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Student Number</label>
                <p className="px-4 py-3 bg-black/20 rounded-xl text-white flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2 text-purple-400" />
                  {formData.studentNumber || 'Not provided'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Student number cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">University</label>
                <p className="px-4 py-3 bg-black/20 rounded-xl text-white flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                  {formData.university || 'Not provided'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">University cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Year of Study</label>
                {isEditing ? (
                  <select
                    value={formData.yearOfStudy}
                    onChange={(e) => setFormData({...formData, yearOfStudy: e.target.value})}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                    <option value="6">6th Year+</option>
                  </select>
                ) : (
                  <p className="px-4 py-3 bg-black/20 rounded-xl text-white">
                    {formData.yearOfStudy ? `Year ${formData.yearOfStudy}` : 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Course/Program</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Your course or program"
                  />
                ) : (
                  <p className="px-4 py-3 bg-black/20 rounded-xl text-white">
                    {formData.course || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Emergency Contact
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Emergency Contact Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Emergency contact name"
                  />
                ) : (
                  <p className="px-4 py-3 bg-black/20 rounded-xl text-white">
                    {formData.emergencyContactName || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Emergency Contact Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Emergency contact phone"
                  />
                ) : (
                  <p className="px-4 py-3 bg-black/20 rounded-xl text-white">
                    {formData.emergencyContactPhone || 'Not provided'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white">
          <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/student/wishlist"
              className="group flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">My Wishlist</h3>
                <p className="text-sm text-neutral-400">View saved accommodations</p>
              </div>
            </Link>

            <Link
              href="/student/settings"
              className="group flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Settings</h3>
                <p className="text-sm text-neutral-400">Manage preferences</p>
              </div>
            </Link>

            <Link
              href="/"
              className="group flex items-center space-x-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">Browse Accommodations</h3>
                <p className="text-sm text-neutral-400">Find your next home</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
            <button
              onClick={handleCancel}
              className="w-full sm:w-auto px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
