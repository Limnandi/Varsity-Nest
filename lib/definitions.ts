export interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: "admin" | "provider" | "student" | "agent"
  phone?: string
  studentNumber?: string
  institution?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  // Computed field for backward compatibility
  name?: string
  // Student-specific fields (from students table)
  university?: "UFS" | "CUT"
  yearOfStudy?: number
  course?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export interface SessionPayload {
  userId: string
  role: "admin" | "provider" | "student" | "agent"
  expiresAt: Date
  [key: string]: any
}

export interface Accommodation {
  id: string
  name: string
  description: string
  address: string
  price: number
  images: string[]
  amenities: string[]
  accreditation_status: "accredited" | "provisionally_accredited" | "non_accredited"
  provider_id: string
  agent_id?: string
  created_at: Date
  updated_at: Date
  is_active: boolean
  contact_email?: string
  contact_phone?: string
  website_url?: string
  latitude?: number
  longitude?: number
  room_types?: string[]
  max_occupancy?: number
  available_from?: Date
  available_until?: Date
}

export interface Provider {
  id: string
  user_id: string
  business_name: string
  business_registration?: string
  contact_person: string
  contact_email: string
  contact_phone: string
  address: string
  website_url?: string
  description?: string
  is_verified: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Agent {
  id: string
  user_id: string
  business_name: string
  business_registration?: string
  contact_person: string
  contact_email: string
  contact_phone: string
  address: string
  website_url?: string
  description?: string
  is_verified: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Student {
  id: string
  user_id: string
  student_number: string
  university: "UFS" | "CUT"
  year_of_study?: number
  course?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  created_at: Date
  updated_at: Date
}

export interface Booking {
  id: string
  student_id: string
  accommodation_id: string
  check_in_date: Date
  check_out_date: Date
  total_amount: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  payment_status: "pending" | "paid" | "failed" | "refunded"
  special_requests?: string
  created_at: Date
  updated_at: Date
}

export interface Review {
  id: string
  student_id: string
  accommodation_id: string
  rating: number
  comment?: string
  is_verified: boolean
  created_at: Date
  updated_at: Date
}

import { z } from "zod"

export const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export const ProviderRegisterFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  contactPerson: z.string().min(2),
  contactPhone: z.string().min(10)
})

export const StudentRegisterFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  studentNumber: z.string().min(5),
  university: z.enum(["UFS", "CUT"])
})

export interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  payment_method: "paystack" | "card" | "eft"
  payment_reference: string
  status: "pending" | "completed" | "failed" | "refunded"
  gateway_response?: any
  created_at: Date
  updated_at: Date
}
