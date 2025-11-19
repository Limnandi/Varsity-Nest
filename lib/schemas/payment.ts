import { z } from "zod"

// Paystack webhook event types
export const PaystackWebhookEventSchema = z.enum([
  "subscription.create",
  "subscription.disable",
  "subscription.not_renew",
  "charge.success",
  "invoice.create",
  "invoice.payment_failed",
  "invoice.update",
  "subscription.expiring_cards",
  "refund.processed",
  "refund.processing",
  "refund.pending",
  "refund.failed"
])

// Paystack webhook base schema
export const PaystackWebhookSchema = z.object({
  event: PaystackWebhookEventSchema,
  data: z.any() // Data structure varies by event type - use z.any() to avoid Zod v4 issues
})

// Paystack subscription data schema
export const PaystackSubscriptionDataSchema = z.object({
  domain: z.string(),
  status: z.enum(["active", "non-renewing", "attention", "completed", "cancelled"]),
  subscription_code: z.string(),
  email_token: z.string().optional(),
  amount: z.number(), // Amount in kobo
  cron_expression: z.string().optional(),
  next_payment_date: z.string().optional(),
  open_invoice: z.string().nullable().optional(),
  plan: z.object({
    name: z.string(),
    plan_code: z.string(),
    amount: z.number(),
    interval: z.string()
  }).optional(),
  customer: z.object({
    id: z.number(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    email: z.string().email(),
    customer_code: z.string(),
    phone: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.any()).nullable().optional()
  }).optional(),
  authorization: z.object({
    authorization_code: z.string(),
    bin: z.string().optional(),
    last4: z.string().optional(),
    exp_month: z.string().optional(),
    exp_year: z.string().optional(),
    channel: z.string().optional(),
    card_type: z.string().optional(),
    bank: z.string().optional(),
    country_code: z.string().optional(),
    brand: z.string().optional(),
    reusable: z.boolean().optional(),
    signature: z.string().optional(),
    account_name: z.string().nullable().optional()
  }).optional()
})

// Paystack invoice data schema
export const PaystackInvoiceDataSchema = z.object({
  domain: z.string(),
  invoice_code: z.string(),
  amount: z.number(), // Amount in kobo
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  status: z.enum(["success", "pending", "failed"]),
  paid: z.boolean(),
  paid_at: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  subscription: PaystackSubscriptionDataSchema.optional(),
  customer: z.object({
    id: z.number(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    email: z.string().email(),
    customer_code: z.string(),
    phone: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.any()).nullable().optional()
  }).optional(),
  transaction: z.object({
    reference: z.string(),
    status: z.string(),
    amount: z.number(),
    currency: z.string()
  }).optional(),
  authorization: z.object({
    authorization_code: z.string(),
    bin: z.string().optional(),
    last4: z.string().optional(),
    exp_month: z.string().optional(),
    exp_year: z.string().optional(),
    channel: z.string().optional(),
    card_type: z.string().optional(),
    bank: z.string().optional(),
    country_code: z.string().optional(),
    brand: z.string().optional(),
    reusable: z.boolean().optional(),
    signature: z.string().optional(),
    account_name: z.string().nullable().optional()
  }).optional(),
  created_at: z.string()
})

// Paystack charge success data schema
// Based on actual Paystack webhook structure for charge.success event
// Using z.any() for complex/variable structures to avoid Zod v4 compatibility issues
export const PaystackChargeSuccessDataSchema = z.object({
  id: z.number().optional(),
  domain: z.string(),
  status: z.string(),
  reference: z.string(),
  amount: z.number(),
  message: z.string().nullable().optional(),
  gateway_response: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
  created_at: z.string(),
  channel: z.string().optional(),
  currency: z.string(),
  ip_address: z.string().nullable().optional(),
  metadata: z.any().optional(), // Can be object, number, string, or null
  log: z.any().optional(),
  fees: z.number().nullable().optional(),
  fees_split: z.any().optional(),
  fees_breakdown: z.any().optional(),
  authorization: z.object({
    authorization_code: z.string(),
    bin: z.string().nullable().optional(),
    last4: z.string().nullable().optional(),
    exp_month: z.string().nullable().optional(),
    exp_year: z.string().nullable().optional(),
    channel: z.string().nullable().optional(),
    card_type: z.string().nullable().optional(),
    bank: z.string().nullable().optional(),
    country_code: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    reusable: z.boolean().optional(),
    signature: z.string().nullable().optional(),
    account_name: z.string().nullable().optional()
  }).optional(),
  customer: z.object({
    id: z.number(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    email: z.string().email(),
    customer_code: z.string(),
    phone: z.string().nullable().optional(),
    metadata: z.any().optional(),
    risk_action: z.string().optional(),
    international_format_phone: z.string().nullable().optional()
  }).optional(),
  plan: z.object({
    name: z.string().optional(),
    plan_code: z.string().optional(),
    amount: z.number().optional(),
    interval: z.string().optional()
  }).optional(),
  subaccount: z.any().optional(),
  split: z.any().optional(),
  order_id: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  requested_amount: z.number().optional(),
  pos_transaction_data: z.any().optional(),
  source: z.any().optional() // Can be string or object
})

// Payment initiation request schema
export const PaymentInitiationSchema = z.object({
  amount: z.number().positive().max(100000, "Amount too high"),
  itemName: z.string().min(1, "Item name required").max(100, "Item name is too long"),
  idempotencyKey: z.string().min(10, "Idempotency key required").max(255, "Idempotency key too long"),
  customData: z.object({
    providerId: z.string().uuid().optional(),
    subscriptionType: z.enum(['monthly', 'yearly', 'one-time']).optional(),
    wantsFeatured: z.boolean().optional(),
  }).optional(),
})

// Payment transaction schema
export const PaymentTransactionSchema = z.object({
  id: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('ZAR'),
  reference: z.string().min(1, "Transaction reference required"), // Paystack reference
  paystackTransactionId: z.string().optional(), // Paystack transaction ID
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  paymentDate: z.date().optional(),
  gatewayResponse: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Payment reconciliation schema
export const PaymentReconciliationSchema = z.object({
  transactionId: z.string(),
  expectedAmount: z.number().positive(),
  actualAmount: z.number().positive(),
  status: z.enum(['matched', 'mismatch', 'missing', 'duplicate']),
  reconciliationDate: z.date(),
  notes: z.string().optional(),
})

// Payment audit log schema
export const PaymentAuditLogSchema = z.object({
  id: z.string().uuid(),
  transactionId: z.string(),
  action: z.enum(['created', 'updated', 'completed', 'failed', 'cancelled', 'reconciled']),
  oldStatus: z.string().optional(),
  newStatus: z.string().optional(),
  amount: z.number().optional(),
  providerId: z.string().uuid().optional(),
  adminId: z.string().uuid().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
})

// Payment security validation
export const PaymentSecuritySchema = z.object({
  ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Invalid IP address"),
  userAgent: z.string().min(1, "User agent required"),
  timestamp: z.date(),
  signature: z.string().min(1, "Signature required"),
  merchantId: z.string().min(1, "Merchant ID required"),
})

export type PaystackWebhook = z.infer<typeof PaystackWebhookSchema>
export type PaystackWebhookEvent = z.infer<typeof PaystackWebhookEventSchema>
export type PaystackSubscriptionData = z.infer<typeof PaystackSubscriptionDataSchema>
export type PaystackInvoiceData = z.infer<typeof PaystackInvoiceDataSchema>
export type PaystackChargeSuccessData = z.infer<typeof PaystackChargeSuccessDataSchema>
export type PaymentInitiation = z.infer<typeof PaymentInitiationSchema>
export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>
export type PaymentReconciliation = z.infer<typeof PaymentReconciliationSchema>
export type PaymentAuditLog = z.infer<typeof PaymentAuditLogSchema>
export type PaymentSecurity = z.infer<typeof PaymentSecuritySchema>
