import { z } from "zod"

// PayFast webhook validation schema
export const PayFastWebhookSchema = z.object({
  // Required PayFast fields
  payment_status: z.enum(['COMPLETE', 'PENDING', 'FAILED', 'CANCELLED']),
  pf_payment_id: z.string().min(1),
  amount_gross: z.string().regex(/^\d+\.\d{2}$/, "Amount must be in format 0.00"),
  m_payment_id: z.string().min(1),
  merchant_id: z.string().min(1),
  
  // Customer information
  name_first: z.string().optional(),
  name_last: z.string().optional(),
  email_address: z.string().email().optional(),
  
  // Payment details
  item_name: z.string().optional(),
  item_description: z.string().optional(),
  
  // Custom data fields
  custom_str1: z.string().optional(), // providerId
  custom_str2: z.string().optional(), // subscriptionType
  custom_str3: z.string().optional(), // paymentId
  custom_str4: z.string().optional(), // wantsFeatured
  
  // Additional PayFast fields
  signature: z.string().min(1),
  token: z.string().optional(),
  payment_date: z.string().optional(),
  
  // Optional fields
  currency: z.string().optional(),
  locale: z.string().optional(),
})

// Payment initiation request schema
export const PaymentInitiationSchema = z.object({
  amount: z.number().positive().max(100000, "Amount too high"),
  itemName: z.string().min(1, "Item name required").max(100, "Item name is too long"),
  customData: z.object({
    providerId: z.string().uuid().optional(),
    subscriptionType: z.enum(['monthly', 'yearly', 'one-time']).optional(),
    wantsFeatured: z.boolean().optional(),
  }).optional(),
})

// Payment transaction schema
export const PaymentTransactionSchema = z.object({
  id: z.string().uuid(),
  providerId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('ZAR'),
  mPaymentId: z.string().min(1, "Payment ID required"),
  pfPaymentId: z.string().optional(),
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

export type PayFastWebhook = z.infer<typeof PayFastWebhookSchema>
export type PaymentInitiation = z.infer<typeof PaymentInitiationSchema>
export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>
export type PaymentReconciliation = z.infer<typeof PaymentReconciliationSchema>
export type PaymentAuditLog = z.infer<typeof PaymentAuditLogSchema>
export type PaymentSecurity = z.infer<typeof PaymentSecuritySchema>
