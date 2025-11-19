/**
 * Paystack Payment Utilities
 * 
 * Core functions for creating Paystack payment requests and handling subscriptions
 * Documentation: https://paystack.com/docs/api
 */

export interface PaystackInitializeRequest {
  email: string
  amount: number // Amount in kobo (smallest currency unit) - for ZAR, multiply by 100
  currency?: string
  reference?: string
  callback_url?: string
  plan?: string // Plan code for subscriptions
  invoice_limit?: number
  metadata?: Record<string, any>
  channels?: string[]
}

export interface PaystackPlanRequest {
  name: string
  interval: "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "biannually" | "annually"
  amount: number // Amount in kobo (smallest currency unit)
  currency?: string
  description?: string
  invoice_limit?: number
  send_invoices?: boolean
  send_sms?: boolean
}

export interface PaystackSubscriptionRequest {
  customer: string // Customer email or customer code
  plan: string // Plan code
  authorization?: string // Authorization code if customer has multiple
  start_date?: string // ISO 8601 format for first debit date
}

/**
 * Convert amount from ZAR (Rands) to kobo (smallest currency unit)
 * Paystack expects amounts in the smallest currency unit
 * For ZAR, we use cents (multiply by 100)
 */
export function convertToKobo(amountInZAR: number): number {
  return Math.round(amountInZAR * 100)
}

/**
 * Convert amount from kobo to ZAR
 */
export function convertFromKobo(amountInKobo: number): number {
  return amountInKobo / 100
}

/**
 * Create Paystack payment initialization request
 * 
 * @param amount - Amount in ZAR (will be converted to kobo)
 * @param userEmail - Customer email
 * @param itemName - Description of the item
 * @param customData - Additional metadata
 * @returns PaystackInitializeRequest
 */
export function createPaystackPayment(
  amount: number,
  userEmail: string,
  _itemName: string,
  customData?: {
    providerId?: string
    agentId?: string
    subscriptionType?: string
    paymentId?: string
    wantsFeatured?: boolean
    idempotencyKey?: string
    planCode?: string // For subscriptions
    invoiceLimit?: number
    entityType?: 'provider' | 'agent' // Explicit entity type for callback URL
  }
): PaystackInitializeRequest {
  // Determine entity type and set appropriate callback URL
  // Prefer explicit entityType, fallback to providerId/agentId check
  console.log(`[PAYSTACK] Received customData:`, customData ? JSON.stringify(customData, null, 2) : 'undefined')
  console.log(`[PAYSTACK] Received customData.entityType: ${customData?.entityType}, type: ${typeof customData?.entityType}, providerId: ${customData?.providerId || 'none'}, agentId: ${customData?.agentId || 'none'}`)
  console.log(`[PAYSTACK] customData keys:`, customData ? Object.keys(customData).join(', ') : 'none')
  const entityType = customData?.entityType || (customData?.providerId ? 'provider' : 'agent')
  // Use NGROK_URL if provided for development, otherwise default to production site
  const baseUrl = process.env.NGROK_URL || 'https://varsitynest.space'
  const callbackUrl = `${baseUrl}/${entityType}/billing/success`
  
  // Log callback URL for debugging
  console.log(`[PAYSTACK] Creating payment - entityType: ${entityType}, callbackUrl: ${callbackUrl}, providerId: ${customData?.providerId || 'none'}, agentId: ${customData?.agentId || 'none'}`)
  
  const request: PaystackInitializeRequest = {
    email: userEmail,
    amount: convertToKobo(amount),
    currency: "ZAR",
    reference: customData?.paymentId || `vn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    callback_url: callbackUrl,
    metadata: {
      custom_fields: [
        {
          display_name: "Entity ID",
          variable_name: "entity_id",
          value: customData?.providerId || customData?.agentId || ""
        },
        {
          display_name: "Subscription Type",
          variable_name: "subscription_type",
          value: customData?.subscriptionType || ""
        },
        {
          display_name: "Payment ID",
          variable_name: "payment_id",
          value: customData?.paymentId || ""
        },
        {
          display_name: "Wants Featured",
          variable_name: "wants_featured",
          value: customData?.wantsFeatured ? "true" : "false"
        },
        {
          display_name: "Idempotency Key",
          variable_name: "idempotency_key",
          value: customData?.idempotencyKey || ""
        }
      ]
    },
    channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer", "eft"]
  }

  // If this is a subscription, add plan code
  if (customData?.planCode) {
    request.plan = customData.planCode
    // Remove amount if plan is provided (plan amount takes precedence)
    // TypeScript workaround: create new object without amount
    const { amount: _, ...requestWithoutAmount } = request
    Object.assign(request, requestWithoutAmount)
    if (customData.invoiceLimit !== undefined) {
      request.invoice_limit = customData.invoiceLimit
    }
  }

  return request
}

/**
 * Create Paystack plan request
 * 
 * @param name - Plan name
 * @param amount - Amount in ZAR (will be converted to kobo)
 * @param interval - Billing interval
 * @param description - Plan description
 * @returns PaystackPlanRequest
 */
export function createPaystackPlan(
  name: string,
  amount: number,
  interval: PaystackPlanRequest["interval"] = "monthly",
  description?: string
): PaystackPlanRequest {
  return {
    name,
    interval,
    amount: convertToKobo(amount),
    currency: "ZAR",
    description: description || `Varsity Nest - ${name}`,
    invoice_limit: 0, // 0 = unlimited until cancelled
    send_invoices: true,
    send_sms: false
  }
}

/**
 * Create Paystack subscription request
 * 
 * @param customerEmail - Customer email or customer code
 * @param planCode - Plan code
 * @param startDate - Optional start date (ISO 8601) for first debit
 * @param authorizationCode - Optional authorization code if customer has multiple
 * @returns PaystackSubscriptionRequest
 */
export function createPaystackSubscription(
  customerEmail: string,
  planCode: string,
  startDate?: string,
  authorizationCode?: string
): PaystackSubscriptionRequest {
  const request: PaystackSubscriptionRequest = {
    customer: customerEmail,
    plan: planCode
  }

  if (startDate) {
    request.start_date = startDate
  }

  if (authorizationCode) {
    request.authorization = authorizationCode
  }

  return request
}

/**
 * Validate Paystack webhook event
 */
export function validatePaystackEvent(event: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!event.event) {
    errors.push("Missing event type")
  }
  
  if (!event.data) {
    errors.push("Missing event data")
  }
  
  // Validate event types
  const validEvents = [
    "subscription.create",
    "subscription.disable",
    "subscription.not_renew",
    "charge.success",
    "invoice.create",
    "invoice.payment_failed",
    "invoice.update",
    "subscription.expiring_cards"
  ]
  
  if (event.event && !validEvents.includes(event.event)) {
    errors.push(`Invalid event type: ${event.event}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

