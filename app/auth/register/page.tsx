"use client"

import type React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    contactNumber: "",
    address: "",
    businessRegistration: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // Simulate registration
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In real app, this would create the account
      alert("Registration successful! Please check your email to verify your account.")
      router.push("/auth/login")
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Join Varsity Nest</h1>
        <p className="text-gray-600 mb-8">Choose your account type to get started.</p>

        <div className="space-y-4">
          <Link
            href="/auth/register/student"
            className="group flex items-center justify-between w-full p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 text-left">I'm a Student</h2>
              <p className="text-gray-600 text-left">Looking for accommodation</p>
            </div>
            <ArrowRight className="w-6 h-6 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/auth/register/provider"
            className="group flex items-center justify-between w-full p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 text-left">I'm a Service Provider</h2>
              <p className="text-gray-600 text-left">Listing accommodation</p>
            </div>
            <ArrowRight className="w-6 h-6 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
