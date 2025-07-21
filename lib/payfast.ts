import crypto from "crypto"

interface PayFastData {
  merchant_id: string
  merchant_key: string
  return_url: string
  cancel_url: string
  notify_url: string
  name_first: string
  name_last: string
  email_address: string
  amount: string
  item_name: string
  item_description: string
  custom_str1?: string
  custom_str2?: string
}

export function generatePayFastSignature(data: PayFastData, passphrase?: string): string {
  // Create parameter string
  let paramString = ""
  const sortedKeys = Object.keys(data).sort()

  for (const key of sortedKeys) {
    const value = data[key as keyof PayFastData]
    if (value !== undefined && value !== "") {
      paramString += `${key}=${encodeURIComponent(value)}&`
    }
  }

  // Remove trailing &
  paramString = paramString.slice(0, -1)

  // Add passphrase if provided
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase)}`
  }

  // Generate MD5 hash
  return crypto.createHash("md5").update(paramString).digest("hex")
}

export function createPayFastPayment(
  amount: number,
  userEmail: string,
  userName: string,
  itemName: string,
  customData?: { providerId?: string; subscriptionType?: string },
): PayFastData & { signature: string } {
  const data: PayFastData = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/billing/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/billing/cancel`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payfast/notify`,
    name_first: userName.split(" ")[0] || userName,
    name_last: userName.split(" ").slice(1).join(" ") || "",
    email_address: userEmail,
    amount: amount.toFixed(2),
    item_name: itemName,
    item_description: `Varsity Nest - ${itemName}`,
    custom_str1: customData?.providerId,
    custom_str2: customData?.subscriptionType,
  }

  const signature = generatePayFastSignature(data, process.env.PAYFAST_PASSPHRASE)

  return { ...data, signature }
}

export function verifyPayFastSignature(data: any, signature: string): boolean {
  const generatedSignature = generatePayFastSignature(data, process.env.PAYFAST_PASSPHRASE)
  return generatedSignature === signature
}
