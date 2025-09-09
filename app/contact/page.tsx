"use client"

import type React from "react"

import { useState } from "react"
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    alert("Thank you for your message! We'll get back to you soon.")
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] pt-36 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight">Contact Us</h1>
          <p className="text-xl text-neutral-300 drop-shadow-lg">
            We're here to help you find your perfect student accommodation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Get in Touch</h2>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 border border-blue-500/50 bg-blue-500/10 rounded-xl">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">Phone</h3>
                  <p className="text-neutral-300">+27 51 123 4567</p>
                  <p className="text-sm text-neutral-500">Mon-Fri 8AM-6PM</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 border border-green-500/50 bg-green-500/10 rounded-xl">
                  <Mail className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">Email</h3>
                  <a href="mailto:info@massiveoperations.co.za" className="text-blue-400 hover:text-blue-300 transition-colors">
                    info@massiveoperations.co.za
                  </a>
                  <p className="text-sm text-neutral-500">We'll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 border border-purple-500/50 bg-purple-500/10 rounded-xl">
                  <MapPin className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">Office</h3>
                  <p className="text-neutral-300">
                    123 Business Street
                    <br />
                    Bloemfontein, 9300
                  </p>
                  <p className="text-sm text-neutral-500">Visit by appointment</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 border border-orange-500/50 bg-orange-500/10 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">Business Hours</h3>
                  <p className="text-neutral-300">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-neutral-300">Saturday: 9:00 AM - 2:00 PM</p>
                  <p className="text-neutral-300">Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Send us a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="+27 XX XXX XXXX"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-300 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  >
                    <option value="">Select a subject</option>
                    <option value="accommodation-inquiry">Accommodation Inquiry</option>
                    <option value="booking-assistance">Booking Assistance</option>
                    <option value="property-listing">List My Property</option>
                    <option value="technical-support">Technical Support</option>
                    <option value="general-inquiry">General Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 resize-vertical"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                <span className="relative z-10 flex items-center">
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  {isSubmitting ? "Sending..." : "Send Message"}
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
