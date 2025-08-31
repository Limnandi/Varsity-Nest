import crypto from "crypto"

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
  subscription_type?: string
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

export function generatePayFastSignature(data: PayFastData, passphrase?: string): string {
  // Create parameter string with sorted keys (PayFast requirement)
  let paramString = ""
  const sortedKeys = Object.keys(data).sort()

  for (const key of sortedKeys) {
    const value = data[key as keyof PayFastData]
    // Only include non-empty values and exclude signature field
    if (value !== undefined && value !== "" && key !== "signature") {
      paramString += `${key}=${encodeURIComponent(value)}&`
    }
  }

  // Remove trailing &
  paramString = paramString.slice(0, -1)

  // Add passphrase if provided (PayFast security requirement)
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase)}`
  }

  // Generate MD5 hash (PayFast standard)
  return crypto.createHash("md5").update(paramString).digest("hex")
}

export function createPayFastPayment(
  amount: number,
  userEmail: string,
  userName: string,
  itemName: string,
  customData?: { 
    providerId?: string
    subscriptionType?: string
    paymentId?: string
    billingDate?: string
    recurringAmount?: number
    cycles?: number
  },
): PayFastData & { signature: string } {
  const data: PayFastData = {
    // Required merchant credentials
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    
    // URLs
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/billing/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/billing/cancel`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payfast/notify`,
    
    // Customer information
    name_first: userName.split(" ")[0] || userName,
    name_last: userName.split(" ").slice(1).join(" ") || "",
    email_address: userEmail,
    
    // Payment details
    amount: amount.toFixed(2),
    item_name: itemName,
    item_description: `Varsity Nest - ${itemName}`,
    
    // Custom data for tracking
    custom_str1: customData?.providerId,
    custom_str2: customData?.subscriptionType,
    custom_str3: customData?.paymentId,
    
    // Currency and locale
    currency: "ZAR",
    locale: "en-za",
    
    // Payment method (let user choose)
    payment_method: "all",
    
    // Subscription details if applicable
    subscription_type: customData?.subscriptionType === "recurring" ? "subscription" : undefined,
    billing_date: customData?.billingDate,
    recurring_amount: customData?.recurringAmount?.toFixed(2),
    cycles: customData?.cycles?.toString(),
    
    // Unique payment ID for tracking
    m_payment_id: customData?.paymentId || `vn_${Date.now()}`,
  }

  // Remove undefined values
  Object.keys(data).forEach(key => {
    if (data[key as keyof PayFastData] === undefined) {
      delete data[key as keyof PayFastData]
    }
  })

  const signature = generatePayFastSignature(data, process.env.PAYFAST_PASSPHRASE)

  return { ...data, signature }
}

export function verifyPayFastSignature(data: any, signature: string): boolean {
  try {
    const generatedSignature = generatePayFastSignature(data, process.env.PAYFAST_PASSPHRASE)
    return generatedSignature === signature
  } catch (error) {
    console.error("Signature verification error:", error)
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
