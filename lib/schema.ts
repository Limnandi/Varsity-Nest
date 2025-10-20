import { pgTable, text, timestamp, boolean, integer, decimal, jsonb, varchar, bigint } from "drizzle-orm/pg-core"

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
  settings: jsonb("settings").default({}),
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
  helpfulVotes: integer("helpful_votes").default(0),
  totalVotes: integer("total_votes").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Review helpfulness votes table
export const reviewHelpfulness = pgTable("review_helpfulness", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  reviewId: varchar("review_id", { length: 255 }).notNull().references(() => reviews.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 255 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Review replies table
export const reviewReplies = pgTable("review_replies", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  reviewId: varchar("review_id", { length: 255 }).notNull().references(() => reviews.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 255 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  helpfulVotes: integer("helpful_votes").default(0),
  totalVotes: integer("total_votes").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Review reports table
export const reviewReports = pgTable("review_reports", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  reviewId: varchar("review_id", { length: 255 }).notNull().references(() => reviews.id, { onDelete: "cascade" }),
  reporterId: varchar("reporter_id", { length: 255 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  reason: varchar("reason", { length: 100 }).notNull().$type<"spam" | "inappropriate" | "fake" | "harassment" | "other">(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().$type<"pending" | "reviewed" | "resolved" | "dismissed">().default("pending"),
  adminId: varchar("admin_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Reply reports table
export const replyReports = pgTable("reply_reports", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  replyId: varchar("reply_id", { length: 255 }).notNull().references(() => reviewReplies.id, { onDelete: "cascade" }),
  reporterId: varchar("reporter_id", { length: 255 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  reason: varchar("reason", { length: 100 }).notNull().$type<"spam" | "inappropriate" | "fake" | "harassment" | "other">(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().$type<"pending" | "reviewed" | "resolved" | "dismissed">().default("pending"),
  adminId: varchar("admin_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  adminNotes: text("admin_notes"),
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

// Payment audit logs table
export const paymentAuditLogs = pgTable("payment_audit_logs", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 50 }).notNull().$type<"created" | "updated" | "completed" | "failed" | "cancelled" | "reconciled">(),
  oldStatus: varchar("old_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  providerId: varchar("provider_id", { length: 255 }).references(() => providers.id, { onDelete: "set null" }),
  adminId: varchar("admin_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Payment reconciliations table
export const paymentReconciliations = pgTable("payment_reconciliations", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  expectedAmount: decimal("expected_amount", { precision: 10, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<"matched" | "mismatch" | "missing" | "duplicate">(),
  reconciliationDate: timestamp("reconciliation_date", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const fileUploadAudits = pgTable("file_upload_audits", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull().$type<"accommodation" | "document" | "profile" | "accreditation">(),
  status: varchar("status", { length: 20 }).notNull().$type<"uploaded" | "rejected" | "quarantined" | "deleted">(),
  reason: text("reason"),
  securityChecks: jsonb("security_checks").notNull(),
  cloudinaryId: varchar("cloudinary_id", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const fileQuarantines = pgTable("file_quarantines", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
  quarantinedFileName: varchar("quarantined_file_name", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  riskScore: integer("risk_score").notNull(),
  threats: text("threats").array().notNull(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<"quarantined" | "released" | "deleted">(),
})

// Student wishlist table
export const studentWishlist = pgTable("student_wishlist", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  studentId: varchar("student_id", { length: 255 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  accommodationId: varchar("accommodation_id", { length: 255 }).notNull().references(() => accommodations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Student preferences table
export const studentPreferences = pgTable("student_preferences", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  studentId: varchar("student_id", { length: 255 }).notNull().references(() => students.id, { onDelete: "cascade" }).unique(),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  marketingEmails: boolean("marketing_emails").default(false),
  profileVisibility: varchar("profile_visibility", { length: 20 }).default("public").$type<"public" | "private" | "friends">(),
  showPhoneNumber: boolean("show_phone_number").default(false),
  showStudentNumber: boolean("show_student_number").default(false),
  twoFactorAuth: boolean("two_factor_auth").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Student profile audit table
export const studentProfileAudit = pgTable("student_profile_audit", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `uuid_generate_v4()::text`),
  studentId: varchar("student_id", { length: 255 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  updatedBy: varchar("updated_by", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})