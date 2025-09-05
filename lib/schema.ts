import { pgTable, uuid, text, timestamp, boolean, numeric, text as textArray, integer, decimal, jsonb, varchar, check } from "drizzle-orm/pg-core"

// Users table - matches actual database schema
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().$type<"admin" | "provider" | "student">(),
  phone: varchar("phone", { length: 20 }),
  studentNumber: varchar("student_number", { length: 50 }),
  institution: varchar("institution", { length: 100 }),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Students table
export const students = pgTable("students", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }),
  studentNumber: varchar("student_number", { length: 50 }).notNull(),
  university: varchar("university", { length: 10 }).notNull().$type<"UFS" | "CUT">(),
  yearOfStudy: integer("year_of_study"),
  course: varchar("course", { length: 200 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Providers table - matches actual database schema
export const providers = pgTable("providers", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  businessRegistration: varchar("business_registration", { length: 100 }),
  contactPerson: varchar("contact_person", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  websiteUrl: varchar("website_url", { length: 500 }),
  description: text("description"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  registrationStatus: varchar("registration_status", { length: 20 }).default("pending").$type<"pending" | "approved" | "rejected">(),
  rejectionReason: text("rejection_reason"),
  documents: jsonb("documents").default([]),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  accreditationStatus: varchar("accreditation_status", { length: 30 }).default("pending").$type<"accredited" | "provisionally_accredited" | "non_accredited" | "pending">(),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("inactive").$type<"inactive" | "active" | "past_due" | "canceled">(),
  lastPaymentDate: timestamp("last_payment_date", { withTimezone: true }),
  nextPaymentDate: timestamp("next_payment_date", { withTimezone: true }),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Accommodations table - matches actual database schema
export const accommodations = pgTable("accommodations", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: jsonb("images").default([]),
  amenities: jsonb("amenities").default([]),
  accreditationStatus: varchar("accreditation_status", { length: 30 }).notNull().$type<"accredited" | "provisionally_accredited" | "non_accredited">(),
  providerId: varchar("provider_id", { length: 255 }).references(() => providers.id, { onDelete: "cascade" }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  websiteUrl: varchar("website_url", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  roomTypes: jsonb("room_types").default([]),
  maxOccupancy: integer("max_occupancy"),
  availableFrom: timestamp("available_from", { mode: "date" }),
  availableUntil: timestamp("available_until", { mode: "date" }),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  area: varchar("area", { length: 100 }),
  distance: text("distance"),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  isOpen: boolean("is_open").default(true),
  featured: boolean("featured").default(false),
  availableRooms: integer("available_rooms").default(0),
  totalRooms: integer("total_rooms").default(0),
  isVerified: boolean("is_verified").default(false),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  accommodationType: varchar("accommodation_type", { length: 50 }),
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  studentId: varchar("student_id", { length: 255 }).references(() => students.id, { onDelete: "cascade" }),
  accommodationId: varchar("accommodation_id", { length: 255 }).references(() => accommodations.id, { onDelete: "cascade" }),
  checkInDate: timestamp("check_in_date", { mode: "date" }).notNull(),
  checkOutDate: timestamp("check_out_date", { mode: "date" }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending").$type<"pending" | "confirmed" | "cancelled" | "completed">(),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending").$type<"pending" | "paid" | "failed" | "refunded">(),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  studentId: varchar("student_id", { length: 255 }).references(() => students.id, { onDelete: "cascade" }),
  accommodationId: varchar("accommodation_id", { length: 255 }).references(() => accommodations.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  bookingId: varchar("booking_id", { length: 255 }).references(() => bookings.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().$type<"payfast" | "card" | "eft">(),
  paymentReference: varchar("payment_reference", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending").$type<"pending" | "completed" | "failed" | "refunded">(),
  gatewayResponse: jsonb("gateway_response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Reports table
export const reports = pgTable("reports", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  reporterId: varchar("reporter_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }),
  reportedAccommodationId: varchar("reported_accommodation_id", { length: 255 }).references(() => accommodations.id, { onDelete: "cascade" }),
  reportType: varchar("report_type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending").$type<"pending" | "investigating" | "resolved" | "dismissed">(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Admin settings table
export const adminSettings = pgTable("admin_settings", {
  id: integer("id").primaryKey().default(1),
  maintenanceMode: boolean("maintenance_mode").default(false),
  registrationEnabled: boolean("registration_enabled").default(true),
  paymentsEnabled: boolean("payments_enabled").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Admin activities table
export const adminActivities = pgTable("admin_activities", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  adminId: varchar("admin_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Webhook events table
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  providerId: varchar("provider_id", { length: 255 }).references(() => providers.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  mPaymentId: varchar("m_payment_id", { length: 100 }).notNull().unique(),
  pfPaymentId: varchar("pf_payment_id", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("pending").$type<"pending" | "completed" | "failed" | "cancelled">(),
  paymentDate: timestamp("payment_date", { withTimezone: true }),
  gatewayResponse: jsonb("gateway_response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
