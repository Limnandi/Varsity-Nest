"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSecuritySchema = exports.PaymentAuditLogSchema = exports.PaymentReconciliationSchema = exports.PaymentTransactionSchema = exports.PaymentInitiationSchema = exports.PayFastWebhookSchema = void 0;
var zod_1 = require("zod");
// PayFast webhook validation schema
exports.PayFastWebhookSchema = zod_1.z.object({
    // Required PayFast fields
    payment_status: zod_1.z.enum(['COMPLETE', 'PENDING', 'FAILED', 'CANCELLED']),
    pf_payment_id: zod_1.z.string().min(1),
    amount_gross: zod_1.z.string().regex(/^\d+\.\d{2}$/, "Amount must be in format 0.00"),
    m_payment_id: zod_1.z.string().min(1),
    merchant_id: zod_1.z.string().min(1),
    // Customer information
    name_first: zod_1.z.string().optional(),
    name_last: zod_1.z.string().optional(),
    email_address: zod_1.z.string().email().optional(),
    // Payment details
    item_name: zod_1.z.string().optional(),
    item_description: zod_1.z.string().optional(),
    // Custom data fields
    custom_str1: zod_1.z.string().optional(), // providerId
    custom_str2: zod_1.z.string().optional(), // subscriptionType
    custom_str3: zod_1.z.string().optional(), // paymentId
    custom_str4: zod_1.z.string().optional(), // wantsFeatured
    // Additional PayFast fields
    signature: zod_1.z.string().min(1),
    token: zod_1.z.string().optional(),
    payment_date: zod_1.z.string().optional(),
    // Optional fields
    currency: zod_1.z.string().optional(),
    locale: zod_1.z.string().optional(),
});
// Payment initiation request schema
exports.PaymentInitiationSchema = zod_1.z.object({
    amount: zod_1.z.number().positive().max(100000, "Amount too high"),
    itemName: zod_1.z.string().min(1, "Item name required").max(100, "Item name is too long"),
    customData: zod_1.z.object({
        providerId: zod_1.z.string().uuid().optional(),
        subscriptionType: zod_1.z.enum(['monthly', 'yearly', 'one-time']).optional(),
        wantsFeatured: zod_1.z.boolean().optional(),
    }).optional(),
});
// Payment transaction schema
exports.PaymentTransactionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    providerId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3).default('ZAR'),
    mPaymentId: zod_1.z.string().min(1, "Payment ID required"),
    pfPaymentId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['pending', 'completed', 'failed', 'cancelled']),
    paymentDate: zod_1.z.date().optional(),
    gatewayResponse: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Payment reconciliation schema
exports.PaymentReconciliationSchema = zod_1.z.object({
    transactionId: zod_1.z.string(),
    expectedAmount: zod_1.z.number().positive(),
    actualAmount: zod_1.z.number().positive(),
    status: zod_1.z.enum(['matched', 'mismatch', 'missing', 'duplicate']),
    reconciliationDate: zod_1.z.date(),
    notes: zod_1.z.string().optional(),
});
// Payment audit log schema
exports.PaymentAuditLogSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    transactionId: zod_1.z.string(),
    action: zod_1.z.enum(['created', 'updated', 'completed', 'failed', 'cancelled', 'reconciled']),
    oldStatus: zod_1.z.string().optional(),
    newStatus: zod_1.z.string().optional(),
    amount: zod_1.z.number().optional(),
    providerId: zod_1.z.string().uuid().optional(),
    adminId: zod_1.z.string().uuid().optional(),
    reason: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    createdAt: zod_1.z.date(),
});
// Payment security validation
exports.PaymentSecuritySchema = zod_1.z.object({
    ipAddress: zod_1.z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Invalid IP address"),
    userAgent: zod_1.z.string().min(1, "User agent required"),
    timestamp: zod_1.z.date(),
    signature: zod_1.z.string().min(1, "Signature required"),
    merchantId: zod_1.z.string().min(1, "Merchant ID required"),
});
