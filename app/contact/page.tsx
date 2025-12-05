"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Phone, Mail, Clock, Send, CheckCircle, AlertCircle, ChevronDown } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"
import { publicEnv } from "@/lib/env.client"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Varsity Nest',
  description: 'Need assistance with student housing, listings, or technical support? Contact the Varsity Nest team for prompt help and information.',
  alternates: {
    canonical: 'https://varsitynest.space/contact',
  },
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubjectOpen, setIsSubjectOpen] = useState(false)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const subjectRef = useRef<HTMLDivElement>(null)

  const subjects = [
    { value: "", label: "Select a subject" },
    { value: "accommodation-inquiry", label: "Accommodation Inquiry" },
    { value: "booking-assistance", label: "Booking Assistance" },
    { value: "property-listing", label: "List My Property" },
    { value: "technical-support", label: "Technical Support" },
    { value: "general-inquiry", label: "General Inquiry" },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectRef.current && !subjectRef.current.contains(event.target as Node)) {
        setIsSubjectOpen(false)
      }
    }

    if (isSubjectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSubjectOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const recaptchaToken = recaptchaRef.current?.getValue()
    if (!recaptchaToken) {
      setSubmitMessage({ type: 'error', text: "Please complete the reCAPTCHA verification" })
      return
    }

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send message. Please try again.")
      }

      setSubmitMessage({ type: 'success', text: data.message || "Thank you for your message! We'll get back to you soon." })
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
      recaptchaRef.current?.reset()
    } catch (error: any) {
      console.error("Contact form error:", error)
      setSubmitMessage({ type: 'error', text: error.message || "Failed to send message. Please try again later." })
      recaptchaRef.current?.reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] pt-36 pb-20 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight break-words px-2">
            Contact Us
          </h1>
          <p className="text-xl text-neutral-300 drop-shadow-lg break-words px-2">
            We&apos;re here to help you find your perfect student accommodation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-blue-500/30 rounded-tl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-500/30 rounded-br-2xl"></div>

            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Get in Touch</h2>

            <div className="space-y-6">
              <div className="group/contact flex items-start space-x-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300">
                <div className="p-3 border border-blue-500/50 bg-blue-500/20 rounded-xl group-hover/contact:bg-blue-500/30 group-hover/contact:border-blue-400/70 transition-all duration-300 group-hover/contact:scale-110">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-white group-hover/contact:text-blue-300 transition-colors duration-300">Phone</h3>
                  <span className="text-neutral-300 break-words block">
                    <a 
                      href="tel:+27624079139" 
                      className="hover:text-blue-400 transition-colors duration-300"
                    >
                      +27 62 407 9139
                    </a>
                  </span>
                  <p className="text-sm text-neutral-500 mt-1">Mon-Fri 8AM-6PM</p>
                </div>
              </div>

              <div className="group/contact flex items-start space-x-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300">
                <div className="p-3 border border-green-500/50 bg-green-500/20 rounded-xl group-hover/contact:bg-green-500/30 group-hover/contact:border-green-400/70 transition-all duration-300 group-hover/contact:scale-110">
                  <Mail className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-white group-hover/contact:text-green-300 transition-colors duration-300">Email</h3>
                  <a href="mailto:support@varsitynest.space" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 break-words">
                    support@varsitynest.space
                  </a>
                  <p className="text-sm text-neutral-500 mt-1">We&apos;ll respond within 24 hours</p>
                </div>
              </div>

              {/* <div className="flex items-start space-x-4">
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
              </div> */}

              <div className="group/contact flex items-start space-x-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300">
                <div className="p-3 border border-orange-500/50 bg-orange-500/20 rounded-xl group-hover/contact:bg-orange-500/30 group-hover/contact:border-orange-400/70 transition-all duration-300 group-hover/contact:scale-110">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-white group-hover/contact:text-orange-300 transition-colors duration-300">Business Hours</h3>
                  <p className="text-neutral-300 break-words">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-neutral-300 break-words">Saturday: 9:00 AM - 2:00 PM</p>
                  <p className="text-neutral-300 break-words">Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-blue-500/30 rounded-tl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-500/30 rounded-br-2xl"></div>

            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Send us a Message</h2>

            {/* Messages */}
            {submitMessage && (
              <div className={`mb-6 p-4 border rounded-xl flex items-start space-x-3 backdrop-blur-sm shadow-lg ${
                submitMessage.type === 'success' 
                  ? 'border-green-500/40 bg-green-500/20 shadow-green-500/20' 
                  : 'border-red-500/40 bg-red-500/20 shadow-red-500/20'
              }`}>
                <div className={`p-2 rounded-full ${
                  submitMessage.type === 'success' 
                    ? 'bg-green-500/30 border border-green-400/50' 
                    : 'bg-red-500/30 border border-red-400/50'
                }`}>
                  {submitMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                </div>
                <span className={`flex-1 min-w-0 break-words ${submitMessage.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                  {submitMessage.text}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group/input">
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2 group-hover/input:text-blue-300 transition-colors duration-300">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 transition-all duration-300 group-hover/input:border-blue-500/30"
                      placeholder="Your full name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm"></div>
                  </div>
                </div>
                <div className="group/input">
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2 group-hover/input:text-blue-300 transition-colors duration-300">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 transition-all duration-300 group-hover/input:border-blue-500/30"
                      placeholder="your.email@varsitynest.space"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group/input">
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-2 group-hover/input:text-blue-300 transition-colors duration-300">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 transition-all duration-300 group-hover/input:border-blue-500/30"
                      placeholder="+27 XX XXX XXXX"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm"></div>
                  </div>
                </div>
                <div className="group/input">
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-300 mb-2 group-hover/input:text-blue-300 transition-colors duration-300">
                    Subject *
                  </label>
                  <div className="relative" ref={subjectRef}>
                    <button
                      type="button"
                      onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                      className="w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 flex items-center justify-between hover:border-blue-500/30 hover:bg-black/40"
                    >
                      <span className={formData.subject ? "text-white" : "text-neutral-400"}>
                        {subjects.find(s => s.value === formData.subject)?.label || "Select a subject"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isSubjectOpen ? 'rotate-180 text-blue-400' : ''}`} />
                    </button>
                    {isSubjectOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-black/40 border border-white/30 backdrop-blur-xl rounded-xl shadow-2xl shadow-blue-500/20 overflow-hidden">
                        {subjects.map((subject) => (
                          <button
                            key={subject.value}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, subject: subject.value }))
                              setIsSubjectOpen(false)
                            }}
                            className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-white/10 ${
                              formData.subject === subject.value
                                ? "bg-blue-600/40 text-white border-l-4 border-blue-500"
                                : "text-neutral-300 hover:text-white"
                            } ${subject.value === "" ? "text-neutral-400" : ""}`}
                          >
                            {subject.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="group/input">
                <label htmlFor="message" className="block text-sm font-medium text-neutral-300 mb-2 group-hover/input:text-blue-300 transition-colors duration-300">
                  Message *
                </label>
                <div className="relative">
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/20 bg-black/30 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-black/40 transition-all duration-300 resize-vertical group-hover/input:border-blue-500/30"
                    placeholder="Tell us how we can help you..."
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm"></div>
                </div>
              </div>

              {/* ReCAPTCHA */}
              <div className="flex justify-center py-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={publicEnv.RECAPTCHA_SITE_KEY}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group/btn relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-500 hover:via-purple-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 flex items-center">
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      <span>Send Message</span>
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
                        →
                      </span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

