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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="text-white text-xl font-semibold">Loading your profile...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!studentUser) {
    return null
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 bg-gradient-to-b from-[#02042b] to-[#040945] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <Toaster richColors position="top-center" />
        
        {/* Header */}
        <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-blue-500/30 p-6 sm:p-8 text-white mb-8">
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-blue-500/30 rounded-tl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-500/30 rounded-br-2xl"></div>
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
              className="group relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:via-white/10 group-hover:to-purple-500/20 animate-shimmer"></div>
              <Edit3 className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Personal Information */}
          <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-green-500/20 p-6 text-white group hover:shadow-green-500/30 transition-all duration-300">
            {/* Decorative Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-green-500/20 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-emerald-500/20 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent flex items-center group-hover:scale-105 transition-transform duration-300">
              <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg mr-3 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300">
                <User className="w-5 h-5 text-green-400" />
              </div>
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Full Name</label>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="relative w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-green-500/20 transition-all duration-300"
                      placeholder="Your full name"
                    />
                  </div>
                ) : (
                  <p className="px-4 py-3 bg-black/30 rounded-xl text-white border border-white/5 hover:border-green-500/30 transition-all duration-300">{formData.name || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Email Address</label>
                <div className="px-4 py-3 bg-black/30 rounded-xl text-white flex items-center border border-white/5 hover:border-blue-500/30 transition-all duration-300">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg mr-3">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  {formData.email}
                </div>
                <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Phone Number</label>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="relative w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-green-500/20 transition-all duration-300"
                      placeholder="Your phone number"
                    />
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-black/30 rounded-xl text-white flex items-center border border-white/5 hover:border-green-500/30 transition-all duration-300">
                    <div className="p-1.5 bg-green-500/20 rounded-lg mr-3">
                      <Phone className="w-4 h-4 text-green-400" />
                    </div>
                    {formData.phone || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-purple-500/20 p-6 text-white group hover:shadow-purple-500/30 transition-all duration-300">
            {/* Decorative Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-purple-500/20 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-pink-500/20 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center group-hover:scale-105 transition-transform duration-300">
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg mr-3 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
                <GraduationCap className="w-5 h-5 text-purple-400" />
              </div>
              Academic Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Student Number</label>
                <div className="px-4 py-3 bg-black/30 rounded-xl text-white flex items-center border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg mr-3">
                    <GraduationCap className="w-4 h-4 text-purple-400" />
                  </div>
                  {formData.studentNumber || 'Not provided'}
                </div>
                <p className="text-xs text-neutral-500 mt-1">Student number cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">University</label>
                <div className="px-4 py-3 bg-black/30 rounded-xl text-white flex items-center border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg mr-3">
                    <MapPin className="w-4 h-4 text-purple-400" />
                  </div>
                  {formData.university || 'Not provided'}
                </div>
                <p className="text-xs text-neutral-500 mt-1">University cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Year of Study</label>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                    <select
                      value={formData.yearOfStudy}
                      onChange={(e) => setFormData({...formData, yearOfStudy: e.target.value})}
                      className="relative w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 appearance-none cursor-pointer"
                    >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                    <option value="6">6th Year+</option>
                  </select>
                  </div>
                ) : (
                  <p className="px-4 py-3 bg-black/30 rounded-xl text-white border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                    {formData.yearOfStudy ? `Year ${formData.yearOfStudy}` : 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Course/Program</label>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({...formData, course: e.target.value})}
                      className="relative w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300"
                      placeholder="Your course or program"
                    />
                  </div>
                ) : (
                  <p className="px-4 py-3 bg-black/30 rounded-xl text-white border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                    {formData.course || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-red-500/20 p-6 text-white lg:col-span-2 group hover:shadow-red-500/30 transition-all duration-300">
            {/* Decorative Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-red-500/20 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-orange-500/20 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent flex items-center group-hover:scale-105 transition-transform duration-300">
              <div className="p-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg mr-3 group-hover:from-red-500/30 group-hover:to-orange-500/30 transition-all duration-300">
                <Phone className="w-5 h-5 text-red-400" />
              </div>
              Emergency Contact
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Emergency Contact Name</label>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                      className="relative w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-red-500/20 transition-all duration-300"
                      placeholder="Emergency contact name"
                    />
                  </div>
                ) : (
                  <p className="px-4 py-3 bg-black/30 rounded-xl text-white border border-white/5 hover:border-red-500/30 transition-all duration-300">
                    {formData.emergencyContactName || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Emergency Contact Phone</label>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300"></div>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
                      className="relative w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-red-500/20 transition-all duration-300"
                      placeholder="Emergency contact phone"
                    />
                  </div>
                ) : (
                  <p className="px-4 py-3 bg-black/30 rounded-xl text-white border border-white/5 hover:border-red-500/30 transition-all duration-300">
                    {formData.emergencyContactPhone || 'Not provided'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-blue-500/30 p-6 text-white group hover:shadow-blue-500/40 transition-all duration-300">
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-blue-500/20 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-purple-500/20 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent flex items-center group-hover:scale-105 transition-transform duration-300">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg mr-3 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/student/wishlist"
              className="group relative flex items-center space-x-4 p-5 border border-white/10 bg-black/30 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-105 hover:border-red-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-pink-500/0 group-hover:from-red-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
              <div className="relative p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-red-500/20">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="relative flex-1">
                <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">My Wishlist</h3>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">View saved accommodations</p>
              </div>
            </Link>

            <Link
              href="/student/settings"
              className="group relative flex items-center space-x-4 p-5 border border-white/10 bg-black/30 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-105 hover:border-blue-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
              <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/20">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div className="relative flex-1">
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Settings</h3>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">Manage preferences</p>
              </div>
            </Link>

            <Link
              href="/"
              className="group relative flex items-center space-x-4 p-5 border border-white/10 bg-black/30 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-105 hover:border-green-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
              <div className="relative p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-green-500/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="relative flex-1">
                <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">Browse Accommodations</h3>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">Find your next home</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
            <button
              onClick={handleCancel}
              className="group w-full sm:w-auto px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 font-medium hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="group relative w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-white/0 to-emerald-500/0 group-hover:from-green-500/20 group-hover:via-white/10 group-hover:to-emerald-500/20 animate-shimmer"></div>
              <Save className={`w-4 h-4 relative z-10 ${isSaving ? 'animate-spin' : ''}`} />
              <span className="relative z-10">{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
