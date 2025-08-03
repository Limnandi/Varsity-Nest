"use client"

import type React from "react"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Building, Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Upload, X } from "lucide-react"
import { registerProvider, type ProviderRegistrationState } from "./actions"

export default function ProviderRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isAccredited, setIsAccredited] = useState<"yes" | "no" | "">("")
  const [accreditedBy, setAccreditedBy] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [state, setState] = useState<{ error?: string; success?: boolean; message?: string }>()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (password !== confirmPassword) {
      setState({ error: 'Passwords do not match' })
      return
    }

    startTransition(async () => {
      const result = await registerProvider(
        { success: false } as ProviderRegistrationState,
        formData
      )
      setState(result)
    })
  }

  const handleAccreditationChange = (university: string, checked: boolean) => {
    if (checked) {
      setAccreditedBy([...accreditedBy, university])
    } else {
      setAccreditedBy(accreditedBy.filter((u) => u !== university))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const isValidType = file.type === "application/pdf" ||
                         file.type.startsWith("image/")
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      
      if (!isValidType) {
        setState({ error: 'Only PDF and image files are allowed' })
        return false
      }
      if (!isValidSize) {
        setState({ error: 'File size must be less than 5MB' })
        return false
      }
      return true
    })

    if (uploadedFiles.length + validFiles.length > 2) {
      alert("You can only upload 1-2 files")
      return
    }
    if (uploadedFiles.length + validFiles.length < 1) {
      alert("You must upload at least 1 file")
      return
    }

    setUploadedFiles([...uploadedFiles, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-blue-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Building className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Registration</h1>
            <p className="text-gray-600">Join Varsity Nest as an accommodation provider</p>
          </div>

          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">{state.message}</span>
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company/Business Name *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="companyName"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ABC Student Housing"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Accreditation Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Accreditation Status</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Are you accredited by UFS or CUT? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isAccredited"
                      value="yes"
                      checked={isAccredited === "yes"}
                      onChange={(e) => setIsAccredited(e.target.value as "yes")}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes, I am accredited</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isAccredited"
                      value="no"
                      checked={isAccredited === "no"}
                      onChange={(e) => setIsAccredited(e.target.value as "no")}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No, I am not accredited</span>
                  </label>
                </div>
              </div>

              {isAccredited === "yes" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Which universities have accredited you? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={accreditedBy.includes("UFS")}
                        onChange={(e) => handleAccreditationChange("UFS", e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">University of the Free State (UFS)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={accreditedBy.includes("CUT")}
                        onChange={(e) => handleAccreditationChange("CUT", e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Central University of Technology (CUT)</span>
                    </label>
                  </div>
                  <input type="hidden" name="accreditedBy" value={accreditedBy.join(",")} />
                </div>
              )}
            </div>

            {/* Pricing Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Subscription Pricing</h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>
                  <strong>Base Price:</strong> R450/month for first accommodation
                </p>
                <p>
                  <strong>Additional Properties:</strong> R100/month each
                </p>
                <p>
                  <strong>Dual Accreditation Bonus:</strong> +R50/month if accredited by both UFS and CUT
                </p>
              </div>
            </div>

            {/* Document Upload for Non-Accredited */}
            {isAccredited === "yes" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Accreditation Documents</h3>
                <p className="text-sm text-gray-600">
                  Upload your accreditation certificates or supporting documents (PDF or images, max 5MB each, up to 3
                  files)
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <label className="cursor-pointer">
                      <span className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Choose Files
                      </span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">PDF or images, max 5MB each</p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Uploaded Files:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="terms"
                required
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1"
              />
              <label className="text-sm text-gray-700">
                I agree to the{" "}
                <Link href="/terms" className="text-purple-600 hover:text-purple-700 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-700 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105 shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Provider Account"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
