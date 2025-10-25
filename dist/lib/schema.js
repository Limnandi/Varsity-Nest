"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentProfileAudit = exports.studentPreferences = exports.studentWishlist = exports.fileQuarantines = exports.fileUploadAudits = exports.paymentReconciliations = exports.paymentAuditLogs = exports.paymentTransactions = exports.webhookEvents = exports.adminActivities = exports.adminSettings = exports.reports = exports.payments = exports.replyReports = exports.reviewReports = exports.reviewReplies = exports.reviewHelpfulness = exports.reviews = exports.bookings = exports.accommodations = exports.providers = exports.students = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// Users table - matches actual database schema
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)("password", { length: 255 }).notNull(),
    firstName: (0, pg_core_1.varchar)("first_name", { length: 100 }).notNull(),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 100 }).notNull(),
    role: (0, pg_core_1.varchar)("role", { length: 20 }).notNull().$type(),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }),
    studentNumber: (0, pg_core_1.varchar)("student_number", { length: 50 }),
    institution: (0, pg_core_1.varchar)("institution", { length: 100 }),
    profileImageUrl: (0, pg_core_1.varchar)("profile_image_url", { length: 500 }),
    profileImageCloudinaryId: (0, pg_core_1.varchar)("profile_image_cloudinary_id", { length: 255 }),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Students table
exports.students = (0, pg_core_1.pgTable)("students", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    userId: (0, pg_core_1.varchar)("user_id", { length: 255 }).references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    studentNumber: (0, pg_core_1.varchar)("student_number", { length: 50 }).notNull(),
    university: (0, pg_core_1.varchar)("university", { length: 10 }).notNull().$type(),
    yearOfStudy: (0, pg_core_1.integer)("year_of_study"),
    course: (0, pg_core_1.varchar)("course", { length: 200 }),
    emergencyContactName: (0, pg_core_1.varchar)("emergency_contact_name", { length: 100 }),
    emergencyContactPhone: (0, pg_core_1.varchar)("emergency_contact_phone", { length: 20 }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Providers table - matches actual database schema
exports.providers = (0, pg_core_1.pgTable)("providers", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    userId: (0, pg_core_1.varchar)("user_id", { length: 255 }).references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    businessName: (0, pg_core_1.varchar)("business_name", { length: 200 }).notNull(),
    businessRegistration: (0, pg_core_1.varchar)("business_registration", { length: 100 }),
    contactPerson: (0, pg_core_1.varchar)("contact_person", { length: 100 }).notNull(),
    contactEmail: (0, pg_core_1.varchar)("contact_email", { length: 255 }).notNull(),
    contactPhone: (0, pg_core_1.varchar)("contact_phone", { length: 20 }).notNull(),
    address: (0, pg_core_1.text)("address").notNull(),
    websiteUrl: (0, pg_core_1.varchar)("website_url", { length: 500 }),
    description: (0, pg_core_1.text)("description"),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    registrationStatus: (0, pg_core_1.varchar)("registration_status", { length: 20 }).default("pending").$type(),
    rejectionReason: (0, pg_core_1.text)("rejection_reason"),
    documents: (0, pg_core_1.jsonb)("documents").default([]),
    city: (0, pg_core_1.varchar)("city", { length: 100 }),
    province: (0, pg_core_1.varchar)("province", { length: 100 }),
    postalCode: (0, pg_core_1.varchar)("postal_code", { length: 20 }),
    accreditationStatus: (0, pg_core_1.varchar)("accreditation_status", { length: 30 }).default("pending").$type(),
    subscriptionStatus: (0, pg_core_1.varchar)("subscription_status", { length: 20 }).default("inactive").$type(),
    lastPaymentDate: (0, pg_core_1.timestamp)("last_payment_date", { withTimezone: true }),
    nextPaymentDate: (0, pg_core_1.timestamp)("next_payment_date", { withTimezone: true }),
    isFeatured: (0, pg_core_1.boolean)("is_featured").default(false),
    settings: (0, pg_core_1.jsonb)("settings").default({}),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Accommodations table - matches actual database schema
exports.accommodations = (0, pg_core_1.pgTable)("accommodations", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 200 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    address: (0, pg_core_1.text)("address").notNull(),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    images: (0, pg_core_1.jsonb)("images").default([]),
    amenities: (0, pg_core_1.jsonb)("amenities").default([]),
    accreditationStatus: (0, pg_core_1.varchar)("accreditation_status", { length: 30 }).notNull().$type(),
    providerId: (0, pg_core_1.varchar)("provider_id", { length: 255 }).references(function () { return exports.providers.id; }, { onDelete: "cascade" }),
    contactEmail: (0, pg_core_1.varchar)("contact_email", { length: 255 }),
    contactPhone: (0, pg_core_1.varchar)("contact_phone", { length: 20 }),
    websiteUrl: (0, pg_core_1.varchar)("website_url", { length: 500 }),
    latitude: (0, pg_core_1.decimal)("latitude", { precision: 10, scale: 8 }),
    longitude: (0, pg_core_1.decimal)("longitude", { precision: 11, scale: 8 }),
    roomTypes: (0, pg_core_1.jsonb)("room_types").default([]),
    maxOccupancy: (0, pg_core_1.integer)("max_occupancy"),
    availableFrom: (0, pg_core_1.timestamp)("available_from", { mode: "date" }),
    availableUntil: (0, pg_core_1.timestamp)("available_until", { mode: "date" }),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    viewCount: (0, pg_core_1.integer)("view_count").default(0),
    area: (0, pg_core_1.varchar)("area", { length: 100 }),
    distance: (0, pg_core_1.text)("distance"),
    rating: (0, pg_core_1.integer)("rating").default(0),
    reviewCount: (0, pg_core_1.integer)("review_count").default(0),
    isOpen: (0, pg_core_1.boolean)("is_open").default(true),
    featured: (0, pg_core_1.boolean)("featured").default(false),
    availableRooms: (0, pg_core_1.integer)("available_rooms").default(0),
    totalRooms: (0, pg_core_1.integer)("total_rooms").default(0),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    city: (0, pg_core_1.varchar)("city", { length: 100 }),
    province: (0, pg_core_1.varchar)("province", { length: 100 }),
    postalCode: (0, pg_core_1.varchar)("postal_code", { length: 20 }),
    accommodationType: (0, pg_core_1.varchar)("accommodation_type", { length: 50 }),
    pricePerMonth: (0, pg_core_1.decimal)("price_per_month", { precision: 10, scale: 2 }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Bookings table
exports.bookings = (0, pg_core_1.pgTable)("bookings", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    studentId: (0, pg_core_1.varchar)("student_id", { length: 255 }).references(function () { return exports.students.id; }, { onDelete: "cascade" }),
    accommodationId: (0, pg_core_1.varchar)("accommodation_id", { length: 255 }).references(function () { return exports.accommodations.id; }, { onDelete: "cascade" }),
    checkInDate: (0, pg_core_1.timestamp)("check_in_date", { mode: "date" }).notNull(),
    checkOutDate: (0, pg_core_1.timestamp)("check_out_date", { mode: "date" }).notNull(),
    totalAmount: (0, pg_core_1.decimal)("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().default("pending").$type(),
    paymentStatus: (0, pg_core_1.varchar)("payment_status", { length: 20 }).notNull().default("pending").$type(),
    specialRequests: (0, pg_core_1.text)("special_requests"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Reviews table
exports.reviews = (0, pg_core_1.pgTable)("reviews", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    studentId: (0, pg_core_1.varchar)("student_id", { length: 255 }).references(function () { return exports.students.id; }, { onDelete: "cascade" }),
    accommodationId: (0, pg_core_1.varchar)("accommodation_id", { length: 255 }).references(function () { return exports.accommodations.id; }, { onDelete: "cascade" }),
    rating: (0, pg_core_1.integer)("rating").notNull(),
    comment: (0, pg_core_1.text)("comment"),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    helpfulVotes: (0, pg_core_1.integer)("helpful_votes").default(0),
    totalVotes: (0, pg_core_1.integer)("total_votes").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Review helpfulness votes table
exports.reviewHelpfulness = (0, pg_core_1.pgTable)("review_helpfulness", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    reviewId: (0, pg_core_1.varchar)("review_id", { length: 255 }).notNull().references(function () { return exports.reviews.id; }, { onDelete: "cascade" }),
    studentId: (0, pg_core_1.varchar)("student_id", { length: 255 }).notNull().references(function () { return exports.students.id; }, { onDelete: "cascade" }),
    isHelpful: (0, pg_core_1.boolean)("is_helpful").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
// Review replies table
exports.reviewReplies = (0, pg_core_1.pgTable)("review_replies", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    reviewId: (0, pg_core_1.varchar)("review_id", { length: 255 }).notNull().references(function () { return exports.reviews.id; }, { onDelete: "cascade" }),
    studentId: (0, pg_core_1.varchar)("student_id", { length: 255 }).notNull().references(function () { return exports.students.id; }, { onDelete: "cascade" }),
    comment: (0, pg_core_1.text)("comment").notNull(),
    helpfulVotes: (0, pg_core_1.integer)("helpful_votes").default(0),
    totalVotes: (0, pg_core_1.integer)("total_votes").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Review reports table
exports.reviewReports = (0, pg_core_1.pgTable)("review_reports", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    reviewId: (0, pg_core_1.varchar)("review_id", { length: 255 }).notNull().references(function () { return exports.reviews.id; }, { onDelete: "cascade" }),
    reporterId: (0, pg_core_1.varchar)("reporter_id", { length: 255 }).notNull().references(function () { return exports.students.id; }, { onDelete: "cascade" }),
    reason: (0, pg_core_1.varchar)("reason", { length: 100 }).notNull().$type(),
    description: (0, pg_core_1.text)("description"),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().$type().default("pending"),
    adminId: (0, pg_core_1.varchar)("admin_id", { length: 255 }).references(function () { return exports.users.id; }, { onDelete: "set null" }),
    adminNotes: (0, pg_core_1.text)("admin_notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Reply reports table
exports.replyReports = (0, pg_core_1.pgTable)("reply_reports", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    replyId: (0, pg_core_1.varchar)("reply_id", { length: 255 }).notNull().references(function () { return exports.reviewReplies.id; }, { onDelete: "cascade" }),
    reporterId: (0, pg_core_1.varchar)("reporter_id", { length: 255 }).notNull().references(function () { return exports.students.id; }, { onDelete: "cascade" }),
    reason: (0, pg_core_1.varchar)("reason", { length: 100 }).notNull().$type(),
    description: (0, pg_core_1.text)("description"),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().$type().default("pending"),
    adminId: (0, pg_core_1.varchar)("admin_id", { length: 255 }).references(function () { return exports.users.id; }, { onDelete: "set null" }),
    adminNotes: (0, pg_core_1.text)("admin_notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Payments table
exports.payments = (0, pg_core_1.pgTable)("payments", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    bookingId: (0, pg_core_1.varchar)("booking_id", { length: 255 }).references(function () { return exports.bookings.id; }, { onDelete: "cascade" }),
    amount: (0, pg_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    currency: (0, pg_core_1.varchar)("currency", { length: 3 }).default("ZAR"),
    paymentMethod: (0, pg_core_1.varchar)("payment_method", { length: 20 }).notNull().$type(),
    paymentReference: (0, pg_core_1.varchar)("payment_reference", { length: 100 }).notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().default("pending").$type(),
    gatewayResponse: (0, pg_core_1.jsonb)("gateway_response"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Reports table
exports.reports = (0, pg_core_1.pgTable)("reports", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    reporterId: (0, pg_core_1.varchar)("reporter_id", { length: 255 }).references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    reportedAccommodationId: (0, pg_core_1.varchar)("reported_accommodation_id", { length: 255 }).references(function () { return exports.accommodations.id; }, { onDelete: "cascade" }),
    reportType: (0, pg_core_1.varchar)("report_type", { length: 50 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().default("pending").$type(),
    adminNotes: (0, pg_core_1.text)("admin_notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Admin settings table
exports.adminSettings = (0, pg_core_1.pgTable)("admin_settings", {
    id: (0, pg_core_1.integer)("id").primaryKey().default(1),
    maintenanceMode: (0, pg_core_1.boolean)("maintenance_mode").default(false),
    registrationEnabled: (0, pg_core_1.boolean)("registration_enabled").default(true),
    paymentsEnabled: (0, pg_core_1.boolean)("payments_enabled").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Admin activities table
exports.adminActivities = (0, pg_core_1.pgTable)("admin_activities", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    activityType: (0, pg_core_1.varchar)("activity_type", { length: 50 }).notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    adminId: (0, pg_core_1.varchar)("admin_id", { length: 255 }).references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
// Webhook events table
exports.webhookEvents = (0, pg_core_1.pgTable)("webhook_events", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
// Payment transactions table
exports.paymentTransactions = (0, pg_core_1.pgTable)("payment_transactions", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    providerId: (0, pg_core_1.varchar)("provider_id", { length: 255 }).references(function () { return exports.providers.id; }, { onDelete: "set null" }),
    amount: (0, pg_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    currency: (0, pg_core_1.varchar)("currency", { length: 3 }).default("ZAR"),
    mPaymentId: (0, pg_core_1.varchar)("m_payment_id", { length: 100 }).notNull().unique(),
    pfPaymentId: (0, pg_core_1.varchar)("pf_payment_id", { length: 100 }),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().default("pending").$type(),
    paymentDate: (0, pg_core_1.timestamp)("payment_date", { withTimezone: true }),
    gatewayResponse: (0, pg_core_1.jsonb)("gateway_response"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Payment audit logs table
exports.paymentAuditLogs = (0, pg_core_1.pgTable)("payment_audit_logs", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    transactionId: (0, pg_core_1.varchar)("transaction_id", { length: 255 }).notNull(),
    action: (0, pg_core_1.varchar)("action", { length: 50 }).notNull().$type(),
    oldStatus: (0, pg_core_1.varchar)("old_status", { length: 20 }),
    newStatus: (0, pg_core_1.varchar)("new_status", { length: 20 }),
    amount: (0, pg_core_1.decimal)("amount", { precision: 10, scale: 2 }),
    providerId: (0, pg_core_1.varchar)("provider_id", { length: 255 }).references(function () { return exports.providers.id; }, { onDelete: "set null" }),
    adminId: (0, pg_core_1.varchar)("admin_id", { length: 255 }).references(function () { return exports.users.id; }, { onDelete: "set null" }),
    reason: (0, pg_core_1.text)("reason"),
    metadata: (0, pg_core_1.jsonb)("metadata"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
// Payment reconciliations table
exports.paymentReconciliations = (0, pg_core_1.pgTable)("payment_reconciliations", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    transactionId: (0, pg_core_1.varchar)("transaction_id", { length: 255 }).notNull(),
    expectedAmount: (0, pg_core_1.decimal)("expected_amount", { precision: 10, scale: 2 }).notNull(),
    actualAmount: (0, pg_core_1.decimal)("actual_amount", { precision: 10, scale: 2 }).notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().$type(),
    reconciliationDate: (0, pg_core_1.timestamp)("reconciliation_date", { withTimezone: true }).defaultNow().notNull(),
    notes: (0, pg_core_1.text)("notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.fileUploadAudits = (0, pg_core_1.pgTable)("file_upload_audits", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    userId: (0, pg_core_1.varchar)("user_id", { length: 255 }).notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    fileName: (0, pg_core_1.varchar)("file_name", { length: 255 }).notNull(),
    fileSize: (0, pg_core_1.bigint)("file_size", { mode: "number" }).notNull(),
    fileType: (0, pg_core_1.varchar)("file_type", { length: 100 }).notNull(),
    purpose: (0, pg_core_1.varchar)("purpose", { length: 50 }).notNull().$type(),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().$type(),
    reason: (0, pg_core_1.text)("reason"),
    securityChecks: (0, pg_core_1.jsonb)("security_checks").notNull(),
    cloudinaryId: (0, pg_core_1.varchar)("cloudinary_id", { length: 255 }),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.fileQuarantines = (0, pg_core_1.pgTable)("file_quarantines", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    originalFileName: (0, pg_core_1.varchar)("original_file_name", { length: 255 }).notNull(),
    quarantinedFileName: (0, pg_core_1.varchar)("quarantined_file_name", { length: 255 }).notNull(),
    reason: (0, pg_core_1.text)("reason").notNull(),
    riskScore: (0, pg_core_1.integer)("risk_score").notNull(),
    threats: (0, pg_core_1.text)("threats").array().notNull(),
    userId: (0, pg_core_1.varchar)("user_id", { length: 255 }).notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    uploadedAt: (0, pg_core_1.timestamp)("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at", { withTimezone: true }).notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().$type(),
});
// Student wishlist table
exports.studentWishlist = (0, pg_core_1.pgTable)("student_wishlist", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    studentId: (0, pg_core_1.varchar)("student_id", { length: 255 }).notNull().references(function () { return exports.students.id; }, { onDelete: "cascade" }),
    accommodationId: (0, pg_core_1.varchar)("accommodation_id", { length: 255 }).notNull().references(function () { return exports.accommodations.id; }, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
// Student preferences table
exports.studentPreferences = (0, pg_core_1.pgTable)("student_preferences", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    studentId: (0, pg_core_1.varchar)("student_id", { length: 255 }).notNull().references(function () { return exports.students.id; }, { onDelete: "cascade" }).unique(),
    emailNotifications: (0, pg_core_1.boolean)("email_notifications").default(true),
    smsNotifications: (0, pg_core_1.boolean)("sms_notifications").default(false),
    marketingEmails: (0, pg_core_1.boolean)("marketing_emails").default(false),
    profileVisibility: (0, pg_core_1.varchar)("profile_visibility", { length: 20 }).default("public").$type(),
    showPhoneNumber: (0, pg_core_1.boolean)("show_phone_number").default(false),
    showStudentNumber: (0, pg_core_1.boolean)("show_student_number").default(false),
    twoFactorAuth: (0, pg_core_1.boolean)("two_factor_auth").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// Student profile audit table
exports.studentProfileAudit = (0, pg_core_1.pgTable)("student_profile_audit", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey().notNull(),
    studentId: (0, pg_core_1.varchar)("student_id", { length: 255 }).notNull().references(function () { return exports.students.id; }, { onDelete: "cascade" }),
    fieldName: (0, pg_core_1.varchar)("field_name", { length: 100 }).notNull(),
    oldValue: (0, pg_core_1.text)("old_value"),
    newValue: (0, pg_core_1.text)("new_value"),
    updatedBy: (0, pg_core_1.varchar)("updated_by", { length: 255 }).notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
