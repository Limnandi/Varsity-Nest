"use client"

import { useState } from "react"
import { Phone, User, Mail, Send } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface ContactAgentProps {
  accommodationId: string
  accommodationName: string
  providerPhone?: string | null
  providerEmail?: string | null
  currentUserRole?: string
  isAuthenticated?: boolean
}

export default function ContactAgent({
  accommodationId,
  accommodationName: _accommodationName,
  providerPhone: _providerPhone,
  providerEmail: _providerEmail,
  currentUserRole,
  isAuthenticated
}: ContactAgentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    message: "I'd like to come stay here, please contact me."
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is authenticated and is a student
    if (!isAuthenticated || currentUserRole !== 'student') {
      toast.error(
        <div className="flex flex-col gap-2">
          <span>Please log in as a student to send a message.</span>
          <span className="text-sm">
            New user?{" "}
            <Link href="/auth/register/student" className="text-blue-400 hover:text-blue-300 underline font-medium">
              Sign up here
            </Link>
          </span>
        </div>,
        { duration: 5000 }
      )
      return
    }
    
    if (!formData.name || !formData.email || !formData.mobile) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/accommodations/${accommodationId}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      toast.success("Message sent successfully! The provider will contact you soon.")
      setFormData({
        name: "",
        email: "",
        mobile: "",
        message: "I'd like to come stay here, please contact me."
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 text-white shadow-2xl shadow-green-500/10 overflow-hidden">
      <h3 className="text-lg sm:text-xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
        Contact Provider
      </h3>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5 flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            Your Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1.5 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            Your Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1.5 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            Your Mobile Number
          </label>
          <input
            type="tel"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter your mobile number"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Message</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="I'd like to come stay here, please contact me."
          />
        </div>

        {/* Terms & Conditions */}
        <p className="text-xs text-neutral-400 text-center">
          By continuing I understand and agree with{" "}
          <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
            Privacy Policy
          </a>
          .
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  )
}

