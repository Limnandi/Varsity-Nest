"use client"

import type React from "react"
import Link from "next/link"
import { ArrowRight, Home } from "lucide-react"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-8">
      <div className="max-w-md w-full relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-center">
        {/* Home Button */}
        <Link 
          href="/" 
          className="absolute top-4 left-4 group p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/20"
        >
          <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight">Join Varsity Nest</h1>
        <p className="text-neutral-300 text-lg mb-8">Choose your account type to get started</p>

        <div className="space-y-6">
          <Link
            href="/auth/register/student"
            className="group relative flex items-center justify-between w-full p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 border border-blue-500/50 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-all duration-300">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">I&apos;m a Student</h2>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Looking for accommodation</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-300" />
          </Link>

          <Link
            href="/auth/register/provider"
            className="group relative flex items-center justify-between w-full p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 border border-purple-500/50 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-all duration-300">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">I&apos;m a Service Provider</h2>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Listing accommodation</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all duration-300" />
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-neutral-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
