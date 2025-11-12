import crypto from "crypto"
import { env } from "@/lib/env"

interface PayFastData {
  // Required fields
  merchant_id: string
  merchant_key: string
  return_url: string
  cancel_url: string
  notify_url: string
  
  // Customer information
  name_first: string
  name_last: string
  email_address: string
  
  // Payment details
  amount: string
  item_name: string
  item_description: string
  
  // Optional fields for better tracking
  custom_str1?: string
  custom_str2?: string
  custom_str3?: string
  custom_str4?: string
  custom_str5?: string
  
  // Additional PayFast fields
  m_payment_id?: string
  subscription_type?: string // Payfast expects "1" for subscription, "2" for ad-hoc
  frequency?: string // 1=Daily, 2=Weekly, 3=Monthly, 4=Quarterly, 5=Biannual, 6=Annual
  billing_date?: string
  recurring_amount?: string
  cycles?: string
  
  // Currency and locale
  currency?: string
  locale?: string
  
  // Payment method preferences
  payment_method?: string
  
  // Security
  signature?: string
}

// Payfast form submission field order (CRITICAL)
// Order must match "the order in which they appear in the attributes description" in Payfast docs
// Source: Payfast documentation - Step 2: Create security signature
// https://developers.payfast.co.za/docs#step_2_signature
// TESTING: Using only basic fields from Payfast example to isolate the issue
export const PAYFAST_FORM_FIELD_ORDER = [
  // Merchant Details (must be first - as per Payfast docs)
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  // Buyer Details (as per Payfast docs order)
  "name_first",
  "name_last",
  "email_address",
  // Transaction Details (as per Payfast example: m_payment_id comes BEFORE amount and item_name)
  "m_payment_id",
  "amount",
  "item_name",
  // Subscription fields (required for recurring payments - add after item_name)
  // Order based on Payfast documentation for recurring billing
  "subscription_type",
  "recurring_amount",
  "frequency",
  "cycles",
  "billing_date",
]

function urlEncodePayfast(value: string): string {
  // Payfast requires uppercase URL encoding and + for spaces
  return encodeURIComponent(value)
    .replace(/%20/g, '+')  // Replace %20 with +
    .replace(/%([0-9A-F]{2})/g, (_match, hex) => `%${hex.toUpperCase()}`)  // Uppercase hex codes
}

export function generatePayFastSignature(data: PayFastData, passphrase?: string): string {
  // Custom/Insite Integration signature generation (for form submissions)
  // NOTE: This is NOT the API signature format (which uses alphabetical ordering)
  // NOTE: merchant_key IS included in signature for form submissions
  // NOTE: Parameters must be in the exact order specified (especially for subscriptions)
  // NOTE: URL encoding must be uppercase and spaces must be +
  // NOTE: passphrase IS URL-encoded and appended at the end
  
  // Build data object (exclude signature only - merchant_key IS included)
  const dataForSignature: Record<string, string> = {}
  for (const key in data) {
    const value = data[key as keyof PayFastData]
    // Only include non-empty values and exclude signature field
    // merchant_key IS included in signature calculation for form submissions
    if (value !== undefined && value !== "" && key !== "signature") {
      dataForSignature[key] = String(value).trim()
    }
  }
  
  // Build parameter string in Payfast's required order
  // CRITICAL: Only include fields in the exact order from Payfast's attributes description
  // Do NOT use alphabetical ordering - this is NOT the API signature format
  let paramString = ""
  for (const key of PAYFAST_FORM_FIELD_ORDER) {
    if (dataForSignature[key]) {
      const encodedValue = urlEncodePayfast(dataForSignature[key])
      paramString += `${key}=${encodedValue}&`
    }
  }
  
  // Remove any fields not in the documented order list
  // Payfast requires exact order from attributes description - no alphabetical fallback

  // Remove trailing &
  paramString = paramString.slice(0, -1)

  // ALWAYS append passphrase at the end (URL-encoded with + for spaces)
  if (passphrase) {
    // Passphrase IS URL-encoded according to Payfast's custom/insite integration example
    const encodedPassphrase = urlEncodePayfast(passphrase.trim())
    paramString += `&passphrase=${encodedPassphrase}`
  }

  // Generate MD5 hash (PayFast standard)
  const signature = crypto.createHash("md5").update(paramString).digest("hex")
  
  return signature
}

//Design pattern: Adapter
export function createPayFastPayment(
  amount: number,
  userEmail: string,
  userName: string,
  itemName: string,
  customData?: { 
    providerId?: string
    agentId?: string
    subscriptionType?: string
    paymentId?: string
    billingDate?: string
    recurringAmount?: number
    cycles?: number
    wantsFeatured?: boolean
    idempotencyKey?: string
  },
): PayFastData & { signature: string } {
  // Determine entity type and set appropriate return URLs
  const entityType = customData?.providerId ? 'provider' : 'agent'
  
  const data: PayFastData = {
    // Required merchant credentials
    merchant_id: env.PAYFAST_MERCHANT_ID,
    merchant_key: env.PAYFAST_MERCHANT_KEY,
    
    // URLs - Dynamic based on entity type (provider or agent)
    return_url: `${env.APP_URL}/${entityType}/billing/success`,
    cancel_url: `${env.APP_URL}/${entityType}/billing/cancel`,
    notify_url: `${env.APP_URL}/api/payfast/notify`,
    
    // Customer information
    name_first: userName.split(" ")[0] || userName,
    name_last: userName.split(" ").slice(1).join(" ") || userName, // Use full name if last name is empty
    email_address: userEmail,
    
    // Payment details
    amount: amount.toFixed(2),
    item_name: itemName,
    item_description: `Varsity Nest - ${itemName}`,
    
    // Custom data for tracking
    custom_str1: customData?.providerId || customData?.agentId,
    custom_str2: customData?.subscriptionType,
    custom_str3: customData?.paymentId,
    custom_str4: customData?.wantsFeatured ? "featured_true" : undefined,
    custom_str5: customData?.idempotencyKey,
    
    // Currency and locale
    currency: "ZAR",
    locale: "en-za",
    
    // Payment method (let user choose)
    payment_method: "all",
    
    // Subscription details if applicable
    // Payfast expects subscription_type as integer: 1 = Subscription, 2 = Ad Hoc
    // For monthly subscriptions (ongoing until cancelled), set subscription_type to "1"
    subscription_type: (customData?.subscriptionType === "recurring" || customData?.subscriptionType === "monthly") ? "1" : undefined,
    // Frequency: 1=Daily, 2=Weekly, 3=Monthly, 4=Quarterly, 5=Biannual, 6=Annual
    // Required when subscription_type is "1"
    // frequency=3 means Monthly billing (not "3 months")
    frequency: (customData?.subscriptionType === "monthly" || customData?.subscriptionType === "recurring") ? "3" : undefined,
    billing_date: customData?.billingDate,
    // PayFast requires recurring_amount minimum of 5.00 ZAR for subscriptions
    // Ensure we meet the minimum requirement
    recurring_amount: customData?.recurringAmount ? Math.max(customData.recurringAmount, 5.00).toFixed(2) : undefined,
    // cycles: "0" means ongoing until cancelled (unlimited)
    // Required for subscriptions - "0" = no limit, continues until cancelled
    cycles: customData?.cycles !== undefined ? customData.cycles.toString() : 
            (customData?.subscriptionType === "monthly" || customData?.subscriptionType === "recurring") ? "0" : undefined,
    
    // Unique payment ID for tracking
    m_payment_id: customData?.paymentId || `vn_${Date.now()}`,
  }

  // Remove undefined and empty string values (PayFast rejects empty strings)
  Object.keys(data).forEach(key => {
    const value = data[key as keyof PayFastData]
    if (value === undefined || value === '') {
      delete data[key as keyof PayFastData]
    }
  })

  const signature = generatePayFastSignature(data, env.PAYFAST_PASSPHRASE)

  // CRITICAL: Only return fields that are in PAYFAST_FORM_FIELD_ORDER or are required for the form
  // This ensures the form submission matches the signature calculation exactly
  const fieldsToInclude = [
    ...PAYFAST_FORM_FIELD_ORDER,
    'signature' // Always include signature
  ]
  
  const finalData: PayFastData & { signature: string } = {
    signature
  } as PayFastData & { signature: string }
  
  // Only include fields that are in the order list (for signature) or signature itself
  for (const key of fieldsToInclude) {
    const value = data[key as keyof PayFastData]
    if (value !== undefined && value !== '') {
      finalData[key as keyof PayFastData] = value as any
      }
    }

    return finalData
}

export function verifyPayFastSignature(data: any, signature: string): boolean {
  try {
    const generatedSignature = generatePayFastSignature(data, env.PAYFAST_PASSPHRASE)
    return generatedSignature === signature
  } catch (error) {
    console.error("Signature verification error:", error)
    return false
  }
}

// Best-practice: Server-to-server ITN verification with PayFast
// Docs: https://developers.payfast.co.za/documentation/#itn-instant-transaction-notification
export async function verifyPayFastITNWithServer(data: Record<string, string>, originalFieldOrder?: string[]): Promise<boolean> {
  try {
    // Build query string in the exact original order if provided, else sorted
    const keys = Array.isArray(originalFieldOrder) && originalFieldOrder.length > 0
      ? originalFieldOrder.filter((k) => k !== 'signature')
      : Object.keys(data).sort()
    const queryString = keys
      .filter((k) => data[k] !== undefined && data[k] !== "" && k !== "signature")
      .map((k) => `${k}=${encodeURIComponent(data[k])}`)
      .join("&")

    const host = env.NODE_ENV === 'production' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za'

    const resp = await fetch(`https://${host}/eng/query/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: queryString,
    })

    const text = (await resp.text()).trim().toLowerCase()
    return text === 'valid'
  } catch (error) {
    console.error('ITN server verification error:', error)
    return false
  }
}

// Helper function to validate PayFast response
export function validatePayFastResponse(data: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check required fields
  const requiredFields = ['payment_status', 'pf_payment_id', 'amount_gross']
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  })
  
  // Validate payment status
  const validStatuses = ['COMPLETE', 'PENDING', 'FAILED', 'CANCELLED']
  if (data.payment_status && !validStatuses.includes(data.payment_status)) {
    errors.push(`Invalid payment status: ${data.payment_status}`)
  }
  
  // Validate amount format
  if (data.amount_gross && isNaN(Number(data.amount_gross))) {
    errors.push('Invalid amount format')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

