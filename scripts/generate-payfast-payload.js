/**
 * Payfast Payload String Generator
 * 
 * This script generates the payload string needed for Payfast Integration Tools testing.
 * 
 * Usage:
 *   node scripts/generate-payfast-payload.js checkout
 *   node scripts/generate-payfast-payload.js itn
 */

const crypto = require('crypto')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Read credentials from environment variables
// Your actual sandbox credentials:
const SANDBOX_CREDENTIALS = {
  merchant_id: process.env.PAYFAST_MERCHANT_ID || "10043458",
  merchant_key: process.env.PAYFAST_MERCHANT_KEY || "7tgdh1holrca4",
  passphrase: process.env.PAYFAST_PASSPHRASE || "j1760d43f2p6"
}

// Load .env file if available
try {
  require('dotenv').config()
  if (process.env.PAYFAST_MERCHANT_ID) {
    SANDBOX_CREDENTIALS.merchant_id = process.env.PAYFAST_MERCHANT_ID
  }
  if (process.env.PAYFAST_MERCHANT_KEY) {
    SANDBOX_CREDENTIALS.merchant_key = process.env.PAYFAST_MERCHANT_KEY
  }
  if (process.env.PAYFAST_PASSPHRASE) {
    SANDBOX_CREDENTIALS.passphrase = process.env.PAYFAST_PASSPHRASE
  }
} catch (e) {
  // dotenv not available, use defaults or env vars
}

/**
 * Generate payload string from data object
 * Payfast integration tool expects: ALL parameters sorted alphabetically INCLUDING passphrase
 */
function generatePayloadString(data, passphrase) {
  // Add passphrase to data object so it gets sorted alphabetically
  const dataWithPassphrase = { ...data }
  if (passphrase) {
    dataWithPassphrase.passphrase = passphrase
  }

  // Sort ALL keys alphabetically (including passphrase)
  const sortedKeys = Object.keys(dataWithPassphrase).sort()
  let paramString = ""

  // Build parameter string (all sorted alphabetically)
  for (const key of sortedKeys) {
    const value = dataWithPassphrase[key]
    // Only include non-empty values and exclude signature field
    if (value !== undefined && value !== "" && value !== null && key !== "signature") {
      paramString += `${key}=${encodeURIComponent(String(value))}&`
    }
  }

  // Remove trailing &
  paramString = paramString.slice(0, -1)

  return paramString
}

/**
 * Generate checkout payload (Signature Troubleshooter)
 */
function generateCheckoutPayload() {
  console.log("\n=== CHECKOUT PAYLOAD (Signature Troubleshooter) ===\n")
  console.log(`Using credentials: Merchant ID=${SANDBOX_CREDENTIALS.merchant_id}, Key=${SANDBOX_CREDENTIALS.merchant_key}\n`)

  // Example checkout data
  const checkoutData = {
    merchant_id: SANDBOX_CREDENTIALS.merchant_id,
    merchant_key: SANDBOX_CREDENTIALS.merchant_key,
    return_url: "http://localhost:3000/provider/billing/success",
    cancel_url: "http://localhost:3000/provider/billing/cancel",
    notify_url: "http://localhost:3000/api/payfast/notify",
    name_first: "John",
    name_last: "Doe",
    email_address: "john@example.com",
    amount: "100.00",
    item_name: "Monthly Subscription",
    item_description: "Varsity Nest - Monthly Subscription",
    custom_str1: "provider-123",
    currency: "ZAR",
    locale: "en-za",
    payment_method: "all",
    m_payment_id: `vn_${Date.now()}`
  }

  const payloadString = generatePayloadString(checkoutData, SANDBOX_CREDENTIALS.passphrase)
  const signature = crypto.createHash("md5").update(payloadString).digest("hex")

  console.log("PAYLOAD STRING (paste into Signature Troubleshooter):")
  console.log("─".repeat(80))
  console.log(payloadString)
  console.log("─".repeat(80))

  console.log("\nEXPECTED SIGNATURE:")
  console.log("─".repeat(80))
  console.log(signature)
  console.log("─".repeat(80))

  console.log("\n✅ Copy the PAYLOAD STRING above and paste it into the Signature Troubleshooter tool")
  console.log("   The tool should generate the same signature as shown above.\n")
}

/**
 * Generate ITN payload (ITN Tester)
 */
function generateITNPayload() {
  console.log("\n=== ITN PAYLOAD (ITN Tester) ===\n")
  console.log(`Using credentials: Merchant ID=${SANDBOX_CREDENTIALS.merchant_id}, Key=${SANDBOX_CREDENTIALS.merchant_key}\n`)

  // Example ITN data (what Payfast sends to your webhook)
  const itnData = {
    m_payment_id: "vn_1234567890",
    pf_payment_id: "12345678",
    payment_status: "COMPLETE",
    item_name: "Monthly Subscription",
    item_description: "Varsity Nest - Monthly Subscription",
    amount_gross: "100.00",
    amount_fee: "-2.50",
    amount_net: "97.50",
    custom_str1: "provider-123",
    custom_str2: "",
    custom_str3: "",
    custom_str4: "",
    custom_str5: "",
    name_first: "John",
    name_last: "Doe",
    email_address: "john@example.com",
    merchant_id: SANDBOX_CREDENTIALS.merchant_id,
    token: "",
    billing_date: "",
    signature: "abc123..." // This is what we're verifying - exclude from payload
  }

  // Remove signature field (we're verifying it, not including it)
  const { signature, ...dataToVerify } = itnData

  const payloadString = generatePayloadString(dataToVerify, SANDBOX_CREDENTIALS.passphrase)
  const expectedSignature = crypto.createHash("md5").update(payloadString).digest("hex")

  console.log("ITN DATA (what Payfast sends):")
  console.log("─".repeat(80))
  console.log(JSON.stringify(itnData, null, 2))
  console.log("─".repeat(80))

  console.log("\nPAYLOAD STRING (paste into ITN Tester - excludes 'signature' field):")
  console.log("─".repeat(80))
  console.log(payloadString)
  console.log("─".repeat(80))

  console.log("\nEXPECTED SIGNATURE (should match the 'signature' field from ITN):")
  console.log("─".repeat(80))
  console.log(expectedSignature)
  console.log("─".repeat(80))

  console.log("\n✅ Copy the PAYLOAD STRING above and paste it into the ITN Tester tool")
  console.log("   The tool should generate the same signature as shown above.\n")
}

/**
 * Interactive mode - ask user what they want to generate
 */
function interactiveMode() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗")
  console.log("║     Payfast Payload String Generator                            ║")
  console.log("╚════════════════════════════════════════════════════════════════╝\n")

  rl.question("What do you want to generate?\n  1. Checkout Payload (Signature Troubleshooter)\n  2. ITN Payload (ITN Tester)\n  3. Both\n\nEnter choice (1-3): ", (answer) => {
    switch(answer.trim()) {
      case "1":
        generateCheckoutPayload()
        rl.close()
        break
      case "2":
        generateITNPayload()
        rl.close()
        break
      case "3":
        generateCheckoutPayload()
        generateITNPayload()
        rl.close()
        break
      default:
        console.log("\n❌ Invalid choice. Please run again and enter 1, 2, or 3.\n")
        rl.close()
    }
  })
}

// Main execution
const mode = process.argv[2]

if (mode === "checkout") {
  generateCheckoutPayload()
} else if (mode === "itn") {
  generateITNPayload()
} else if (mode === "both") {
  generateCheckoutPayload()
  generateITNPayload()
} else {
  interactiveMode()
}

