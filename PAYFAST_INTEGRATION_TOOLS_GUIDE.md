# Payfast Integration Tools Guide

## What is "Integration"?

**Integration** means connecting your application to Payfast's payment gateway. It involves two main flows:

1. **Outgoing (Checkout):** Your app sends payment data to Payfast → Payfast processes payment
2. **Incoming (ITN):** Payfast sends transaction results back to your app → Your app verifies and processes

Both flows require **digital signatures** to ensure data hasn't been tampered with. The Integration Tools help you verify these signatures are generated correctly.

---

## Tool 1: Signature Troubleshooter (Checkout Signature)

### What You're Testing
This tests the **outgoing signature** - the signature your app generates when sending a payment request to Payfast.

### What to Populate
You need to paste the **payload string** that your app creates BEFORE hashing it to generate the signature.

### How to Generate the Payload String

The payload string is built from your payment data in this format:
```
key1=value1&key2=value2&key3=value3&passphrase=your_passphrase
```

**Steps to generate it:**

1. **Create a test payment object** (this is what your app sends to Payfast):

```javascript
// Example payment data (what createPayFastPayment generates)
const paymentData = {
  merchant_id: "10000100",
  merchant_key: "46f0b409101a",
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
  m_payment_id: "vn_1234567890"
}
```

2. **Build the payload string** (this is what you paste into the tool):

```javascript
// Step 1: Sort all keys alphabetically (excluding 'signature')
const sortedKeys = Object.keys(paymentData).sort()

// Step 2: Build the string with URL-encoded values
let paramString = ""
for (const key of sortedKeys) {
  const value = paymentData[key]
  if (value !== undefined && value !== "" && key !== "signature") {
    paramString += `${key}=${encodeURIComponent(value)}&`
  }
}

// Step 3: Remove trailing &
paramString = paramString.slice(0, -1)

// Step 4: Add passphrase
paramString += `&passphrase=${encodeURIComponent("j1760d43f2p6")}`
```

3. **The final payload string** (copy this into the tool):
```
amount=100.00&cancel_url=http%3A%2F%2Flocalhost%3A3000%2Fprovider%2Fbilling%2Fcancel&currency=ZAR&custom_str1=provider-123&email_address=john%40example.com&item_description=Varsity%20Nest%20-%20Monthly%20Subscription&item_name=Monthly%20Subscription&locale=en-za&m_payment_id=vn_1234567890&merchant_id=10000100&merchant_key=46f0b409101a&name_first=John&name_last=Doe&notify_url=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fpayfast%2Fnotify&payment_method=all&return_url=http%3A%2F%2Flocalhost%3A3000%2Fprovider%2Fbilling%2Fsuccess&passphrase=j1760d43f2p6
```

### Quick Test Script

Create a temporary test file to generate the payload string:

```javascript
// test-payload.js
const crypto = require('crypto')

const paymentData = {
  merchant_id: "10000100",
  merchant_key: "46f0b409101a",
  return_url: "http://localhost:3000/provider/billing/success",
  cancel_url: "http://localhost:3000/provider/billing/cancel",
  notify_url: "http://localhost:3000/api/payfast/notify",
  name_first: "John",
  name_last: "Doe",
  email_address: "john@example.com",
  amount: "100.00",
  item_name: "Monthly Subscription",
  item_description: "Varsity Nest - Monthly Subscription",
  currency: "ZAR",
  locale: "en-za",
  payment_method: "all",
  m_payment_id: "vn_1234567890"
}

const passphrase = "j1760d43f2p6"

// Build payload string
const sortedKeys = Object.keys(paymentData).sort()
let paramString = ""

for (const key of sortedKeys) {
  const value = paymentData[key]
  if (value !== undefined && value !== "" && key !== "signature") {
    paramString += `${key}=${encodeURIComponent(value)}&`
  }
}

paramString = paramString.slice(0, -1)
paramString += `&passphrase=${encodeURIComponent(passphrase)}`

console.log("PAYLOAD STRING (paste this into Signature Troubleshooter):")
console.log(paramString)
console.log("\nEXPECTED SIGNATURE (for verification):")
console.log(crypto.createHash("md5").update(paramString).digest("hex"))
```

Run it:
```bash
node test-payload.js
```

Copy the "PAYLOAD STRING" output and paste it into the **Signature Troubleshooter** tool.

### What the Tool Does
1. Takes your payload string
2. Generates Payfast's signature from it
3. Compares it with what your app would generate
4. Tells you if they match ✅ or don't match ❌

**If they match:** Your signature generation is correct!  
**If they don't match:** Check for:
- Missing or extra fields
- Incorrect URL encoding
- Wrong passphrase
- Incorrect key sorting

---

## Tool 2: ITN Tester (Webhook Signature)

### What You're Testing
This tests the **incoming signature** - the signature Payfast sends in the ITN (Instant Transaction Notification) webhook that your app receives after a payment.

### What to Populate
You need to paste the **payload string** from the ITN webhook that Payfast sends to your app.

### How to Get the ITN Payload String

**Option 1: From a Real Test Transaction (Recommended)**

1. Make a test payment through your app
2. When Payfast calls your webhook (`/api/payfast/notify`), the ITN payload string is automatically logged to your terminal
3. Look for this section in your terminal logs:
   ```
   [PAYFAST ITN] ===== COPY THIS FOR ITN TESTER =====
   [PAYFAST ITN] ===== END OF ITN PAYLOAD STRING =====
   ```
4. Copy the payload string between these markers and paste it into the ITN Tester tool

**Note:** If you're testing on localhost, Payfast may not be able to reach your webhook. In that case, use Option 2 below or expose your localhost with ngrok.

**Option 2: Simulate ITN Data**

Payfast sends ITN data in this format. Here's an example:

```javascript
// Example ITN data Payfast sends to your webhook
const itnData = {
  "m_payment_id": "vn_1234567890",
  "pf_payment_id": "12345678",
  "payment_status": "COMPLETE",
  "item_name": "Monthly Subscription",
  "item_description": "Varsity Nest - Monthly Subscription",
  "amount_gross": "100.00",
  "amount_fee": "-2.50",
  "amount_net": "97.50",
  "custom_str1": "provider-123",
  "custom_str2": "",
  "custom_str3": "",
  "custom_str4": "",
  "custom_str5": "",
  "name_first": "John",
  "name_last": "Doe",
  "email_address": "john@example.com",
  "merchant_id": "10000100",
  "token": "",
  "billing_date": "",
  "signature": "abc123..." // This is what we're verifying
}
```

**Build the payload string** (same process as checkout):

```javascript
// Remove the signature field first (we're verifying it)
const { signature, ...dataToVerify } = itnData

// Build payload string
const sortedKeys = Object.keys(dataToVerify).sort()
let paramString = ""

for (const key of sortedKeys) {
  const value = dataToVerify[key]
  if (value !== undefined && value !== "" && value !== null && key !== "signature") {
    paramString += `${key}=${encodeURIComponent(String(value))}&`
  }
}

paramString = paramString.slice(0, -1)
paramString += `&passphrase=${encodeURIComponent("j1760d43f2p6")}`
```

### Quick Test Script for ITN

```javascript
// test-itn-payload.js
const crypto = require('crypto')

// Example ITN data (what Payfast sends to your webhook)
const itnData = {
  "m_payment_id": "vn_1234567890",
  "pf_payment_id": "12345678",
  "payment_status": "COMPLETE",
  "item_name": "Monthly Subscription",
  "amount_gross": "100.00",
  "amount_fee": "-2.50",
  "amount_net": "97.50",
  "custom_str1": "provider-123",
  "name_first": "John",
  "name_last": "Doe",
  "email_address": "john@example.com",
  "merchant_id": "10000100",
  "signature": "abc123..." // This is what we're verifying - exclude it from payload
}

const passphrase = "j1760d43f2p6"

// Remove signature and build payload
const { signature, ...dataToVerify } = itnData

const sortedKeys = Object.keys(dataToVerify).sort()
let paramString = ""

for (const key of sortedKeys) {
  const value = dataToVerify[key]
  if (value !== undefined && value !== "" && value !== null && key !== "signature") {
    paramString += `${key}=${encodeURIComponent(String(value))}&`
  }
}

paramString = paramString.slice(0, -1)
paramString += `&passphrase=${encodeURIComponent(passphrase)}`

console.log("ITN PAYLOAD STRING (paste this into ITN Tester):")
console.log(paramString)
console.log("\nEXPECTED SIGNATURE (should match the 'signature' field from ITN):")
console.log(crypto.createHash("md5").update(paramString).digest("hex"))
```

### What the Tool Does
1. Takes your ITN payload string
2. Generates Payfast's signature from it
3. Compares it with the signature Payfast sent in the ITN
4. Tells you if they match ✅ or don't match ❌

**If they match:** Your ITN signature verification is correct!  
**If they don't match:** Check for:
- Missing fields in your payload
- Incorrect URL encoding
- Wrong passphrase
- Not excluding the signature field from the payload

---

## Practical Testing Workflow

### Step 1: Test Checkout Signature (Signature Troubleshooter)

1. **Generate a test payment** in your app (or use the test script above)
2. **Extract the payload string** before it's hashed
3. **Paste it into "Signature Troubleshooter"**
4. **Click "Test signature matching"**
5. **Verify the signature matches** ✅

### Step 2: Test ITN Signature (ITN Tester)

1. **Make a test payment** through Payfast Sandbox
2. **Check your terminal logs** - the ITN payload string is automatically logged when the webhook is called
3. **Look for the section marked "COPY THIS FOR ITN TESTER"** in your terminal
4. **Copy the payload string** (it includes all fields except 'signature', sorted alphabetically, with passphrase appended)
5. **Paste it into "ITN Tester"** in the Payfast Sandbox dashboard
6. **Click "Test signature matching"**
7. **Verify the signature matches** ✅

**Note:** The ITN payload string is automatically generated and logged by the webhook endpoint (`/api/payfast/notify`) when Payfast calls it. The payload uses alphabetical ordering (different from form submission) and includes the passphrase.

---

## Common Issues & Solutions

### Issue: Signatures Don't Match

**Checklist:**
- ✅ Are all fields included? (Check for missing optional fields)
- ✅ Are keys sorted alphabetically?
- ✅ Are values URL-encoded correctly?
- ✅ Is the passphrase included at the end?
- ✅ Is the 'signature' field excluded from the payload?
- ✅ Are empty/null values excluded?

### Issue: Can't Generate Payload String

**Solution:** Use the test scripts above or add logging to your code:

```typescript
// In lib/payfast.ts, add logging before signature generation
export function generatePayFastSignature(data: PayFastData, passphrase?: string): string {
  // ... existing code ...
  
  // Add this for debugging (remove in production!)
  if (process.env.NODE_ENV === 'development') {
    console.log('PAYLOAD STRING FOR TESTING:', paramString)
  }
  
  return crypto.createHash("md5").update(paramString).digest("hex")
}
```

### Issue: ITN Payload Not Matching

**Solution:** Check your webhook handler logs. The ITN data comes as form data:

```typescript
// In app/api/payfast/notify/route.ts
const formData = await request.formData()
const rawData: any = {}

formData.forEach((value, key) => {
  rawData[key] = value.toString()
  console.log(`ITN Field: ${key} = ${value}`) // Log for debugging
})
```

---

## Summary

| Tool | Tests | What to Paste | When to Use |
|------|-------|---------------|-------------|
| **Signature Troubleshooter** | Outgoing checkout signature | Payload string BEFORE hashing (with passphrase) | Before going live, when signatures fail |
| **ITN Tester** | Incoming webhook signature | ITN payload string (without signature field, with passphrase) | When ITN verification fails, after test payments |

**Remember:** 
- Both tools need the **payload string** (not the signature itself)
- The payload string must include the passphrase at the end
- Keys must be sorted alphabetically
- Values must be URL-encoded

---

## Quick Reference: Payload String Format

```
key1=urlEncodedValue1&key2=urlEncodedValue2&key3=urlEncodedValue3&passphrase=your_passphrase
```

**Rules:**
1. Sort keys alphabetically
2. URL-encode all values
3. Exclude empty/null/undefined values
4. Exclude the 'signature' field
5. Add passphrase at the end
6. Use `&` as separator
7. No trailing `&`

---

**Ready to test!** Start with the Signature Troubleshooter, then move to ITN Tester after making a test payment.

