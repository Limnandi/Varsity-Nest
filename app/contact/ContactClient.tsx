"use client";

import React, { useState, useRef, useEffect } from "react";
import { Phone, Mail, Clock, Send, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { publicEnv } from "@/lib/env.client";

export default function ContactClient() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const subjectRef = useRef<HTMLDivElement>(null);

  const subjects = [
    { value: "", label: "Select a subject" },
    { value: "accommodation-inquiry", label: "Accommodation Inquiry" },
    { value: "booking-assistance", label: "Booking Assistance" },
    { value: "property-listing", label: "List My Property" },
    { value: "technical-support", label: "Technical Support" },
    { value: "general-inquiry", label: "General Inquiry" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectRef.current && !subjectRef.current.contains(event.target as Node)) {
        setIsSubjectOpen(false);
      }
    };

    if (isSubjectOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSubjectOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      setSubmitMessage({ type: "error", text: "Please complete the reCAPTCHA verification" });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, recaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setSubmitMessage({ type: "success", text: data.message || "Thank you for your message! We'll get back to you soon." });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      recaptchaRef.current?.reset();
    } catch (error: any) {
      console.error("Contact form error:", error);
      setSubmitMessage({ type: "error", text: error.message || "Failed to send message. Please try again later." });
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">Contact Varsity Nest</h1>
          <p className="text-neutral-300 text-base">Last Updated: November 2025</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-white shadow-2xl shadow-blue-500/20">
          {/* Replace with your actual form fields and structure from the original page */}
          <div className="mb-4">
            <input
              name="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
              className="w-full p-3 rounded-md bg-white/5 border border-white/10"
            />
          </div>
          <div className="mb-4">
            <input
              name="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Your email"
              className="w-full p-3 rounded-md bg-white/5 border border-white/10"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn">
            {isSubmitting ? "Sending..." : "Send"}
          </button>
          {submitMessage && <div className={`mt-4 ${submitMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>{submitMessage.text}</div>}</n>        </form>
      </div>
    </div>
  );
}
