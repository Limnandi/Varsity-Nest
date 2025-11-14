# Paystack Integration Guide

Complete documentation for integrating Paystack payment gateway into Varsity Nest.

## Table of Contents
1. [Recurring Charges](#recurring-charges)
2. [Two Factor Authentication](#two-factor-authentication)
3. [Verify Payments](#verify-payments)
4. [Charge Returning Users](#charge-returning-users)
5. [API Endpoints](#api-endpoints)
6. [Webhook Events](#webhook-events)
7. [Trial Subscription Workaround](#trial-subscription-workaround)

---

## Recurring Charges

### Overview
Once a customer has made the first successful payment with their card or direct debit account, you can store the customer's authorization and use it for subsequent transactions. This currently works for cards in all our markets, and direct debit for businesses in Nigeria.

### Charge the First Transaction

**Note:** This step is not needed for Direct Debit charges. Instead, you'll initiate an authorization request via the Initialize Authorization API endpoint. You'll save the authorization returned via webhooks, once the customer approves it.

You can initialize this first charge from web or your mobile app. Check out the different integration methods for web and mobile.

### Why do I need to charge the user to add their cards?

Local regulations require that users authenticate the card through 2FA in an initial transaction before we can charge the card subsequently. It allows us to ensure that the card is valid and can be charged for subsequent transactions.

### Minimum Charge Amount

The minimum amount recommended for the first charge is:
- **NGN 50.00** (Nigeria)
- **GHS 0.10** (Ghana)
- **ZAR 1.00** (South Africa) ⭐ **Used in our implementation**
- **KES 3.00** (Kenya)
- **USD 2.00** (United States)

Lower amounts aren't guaranteed to work on all card brands or banks. It is standard practice to credit the user back with value (in your app) worth the tokenization amount, or simply refund the money back.

### Get the Card Authorization

If the first transaction is successful, you can listen to events on your webhook endpoint. Alternatively, you can use the Verify Transaction API endpoint to confirm the status of the transaction.

**Response Example:**
```json
{
  "data": {
    "authorization": {
      "authorization_code": "AUTH_8dfhjjdt",
      "card_type": "visa",
      "last4": "1381",
      "exp_month": "08",
      "exp_year": "2018",
      "bin": "412345",
      "bank": "TEST BANK",
      "channel": "card",
      "signature": "SIG_idyuhgd87dUYSHO92D",
      "reusable": true,
      "country_code": "NG",
      "account_name": "BoJack Horseman"
    }
  }
}
```

**Authorization Object Properties:**

| Property | Description |
|----------|-------------|
| `authorization_code` | The code that is used to charge the card subsequently |
| `card_type` | Card brand - Visa, Mastercard, etc |
| `last4` | The last 4 digits of the card |
| `exp_month` | The expiry month of the card in digits (e.g., "01" means January) |
| `exp_year` | The expiry year of the card |
| `bin` | The first 6 digits of the card |
| `bank` | The customer's bank, the bank that issued the card |
| `channel` | What payment channel this is (e.g., "card") |
| `signature` | A unique identifier for the card being used. While new authorization codes are created each time a card is used, the card's signature will remain the same |
| `reusable` | A boolean flag that tells you if an authorization can be used for a recurring charge. You should only attempt to use the authorization_code if this flag returns as true |
| `country_code` | A two-letter country code (ISO 3166-1 alpha-2) representing the country of the bank where the card was issued |

### Store the Authorization

Next, you need to store the authorization and the email used for the transaction. These details can be used to charge the card subsequently.

**Important Notes:**
- Every payment instrument that is used on your site/app has a unique signature
- The signature can be used to ensure that you do not save an authorization multiple times
- It is important to store the entire authorization object in order not to lose any context regarding the card
- It is also important to store the email used to create an authorization because only the email used to create an authorization can be used to charge it. If you rely on the user's email stored on your system and the user changes it, the authorization can no longer be charged

When you have the whole authorization object saved, you can display customer payment details at the point of payment to charge recurrently. For example, when the user wants to pay again, you can display the card for the user as "Access Bank Visa card ending with 1234".

### Charge the Authorization

When the user selects the card or direct debit account for a new transaction or when you want to charge them subsequently, you send the `authorization_code`, user's email and the amount you want to charge to the charge authorization API.

**Request Example:**
```json
{
  "authorization_code": "AUTH_pmx3mgawyd",
  "email": "mail@mail.com",
  "amount": 300000
}
```

**Response Example:**
```json
{
  "status": true,
  "message": "Charge attempted",
  "data": {
    "amount": 35247,
    "currency": "NGN",
    "transaction_date": "2024-08-22T10:53:49.000Z",
    "status": "success",
    "reference": "0m7frfnr47ezyxl",
    "domain": "test",
    "metadata": "",
    "gateway_response": "Approved",
    "message": null,
    "channel": "card",
    "ip_address": null,
    "log": null,
    "fees": 10247,
    "authorization": {
      "authorization_code": "AUTH_pmx3mgawyd",
      "bin": "408408",
      "last4": "4081",
      "exp_month": "12",
      "exp_year": "2030",
      "channel": "card",
      "card_type": "visa ",
      "bank": "TEST BANK",
      "country_code": "NG",
      "brand": "visa",
      "reusable": true,
      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",
      "account_name": null
    },
    "customer": {
      "id": 181873746,
      "first_name": null,
      "last_name": null,
      "email": "demo@test.com",
      "customer_code": "CUS_1rkzaqsv4rrhqo6",
      "phone": null,
      "metadata": {
        "custom_fields": [
          {
            "display_name": "Customer email",
            "variable_name": "customer_email",
            "value": "new@email.com"
          }
        ]
      },
      "risk_action": "default",
      "international_format_phone": null
    },
    "plan": null,
    "id": 4099490251
  }
}
```

### Charging at Intervals

If your application needs to charge the authorizations at certain intervals, it means your server needs to have a cron job that runs at particular intervals and picks all the authorizations that needs to be charged.

---

## Two Factor Authentication

### Feature Availability

By default, this feature is available to betting merchants with a Nigerian integration and specific to cards issued by Guaranty Trust Bank (GTB), Access Bank, United Bank for Africa (UBA), Zenith Bank & First Bank of Nigeria.

If you have a Nigerian integration and would like to get this feature, kindly send an email to support@paystack.com

### Overview

Two Factor Authentication (2FA) is an extra security step taken to confirm that you aren't processing the request of a malicious actor. The user making the request is generally asked to provide some form of information that is unique to them.

In order to ensure a user's card isn't being used by a malicious actor, we challenge the user by asking the user to authorize the transaction. Authorization can be done by using a hardware token, OTP, PIN + OTP, or 3DS.

### Handling 2FA Challenges

The request to charge the card remains the same. However, the response is different for cards that will be challenged:

**Response for Challenged Cards:**
```json
{
  "status": true,
  "message": "Please, redirect your customer to the authorization url provided",
  "data": {
    "authorization_url": "https://checkout.paystack.com/resume/0744ub5o065nwyz",
    "reference": "jvx2o36ghlvrgtt",
    "access_code": "0744ub5o065nwyz",
    "paused": true
  }
}
```

**Key Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `paused` | boolean | Returns `true` when a card is being challenged |
| `authorization_url` | string | A checkout URL for authorization of the transaction |

You should check the value of the `data.paused` parameter to confirm if a card is being challenged. If it's being challenged, you should redirect the user to the `data.authorization_url` to complete the authorization.

On completion of the authorization, we proceed to charge the user's card. You should save the `data.reference` value to verify the status of the transaction either via webhooks or the verify transaction API.

### Handling Redirect

When the user completes the authorization process, we typically redirect the user back to the callback URL you've set on your Paystack Dashboard.

If you want us to redirect to a different URL, you can add the URL to the `callback_url` parameter of your request:

```json
{
  "authorization_code": "AUTH_ibegucp8kk",
  "email": "dami@2fa.com",
  "amount": 3000,
  "callback_url": "https://yourcallbackurl.com"
}
```

The user might also cancel the authorization process. You can add a URL that the user should be redirected to when they cancel in the metadata object:

```json
{
  "authorization_code": "AUTH_ibegucp8kk",
  "email": "dami@2fa.com",
  "amount": 3000,
  "metadata": {
    "cancel_action": "https://yourcancelurl.com"
  }
}
```

---

## Verify Payments

### Overview

The Verify Transaction API allows you confirm the status of a customer's transaction.

### Transaction Statuses

Webhooks are the preferred option for confirming a transaction status, but we currently send webhook events for just successful transactions. However, a transaction can have the following statuses:

| Status | Meaning |
|--------|---------|
| `abandoned` | The customer has not completed the transaction |
| `failed` | The transaction failed. For more information on why, refer to the message/gateway response |
| `ongoing` | The customer is currently trying to carry out an action to complete the transaction. This can get returned when we're waiting on the customer to enter an otp or to make a transfer (for a pay with transfer transaction) |
| `pending` | The transaction is currently in progress |
| `processing` | Same as pending, but for direct debit transactions |
| `queued` | The transaction has been queued to be processed later. Only possible on bulk charge transactions |
| `reversed` | The transaction was reversed. This could mean the transaction was refunded, or a chargeback was successfully logged for this transaction |
| `success` | The transaction was successfully processed |

### Verify a Transaction

You do this by making a GET request to the Verify Transaction API endpoint from your server using your transaction reference. This is dependent on the method you used to initialize the transaction.

**From Popup or Mobile SDKs:**
You'll have to send the reference to your server, then from your server you call the verify endpoint.

**From the Redirect API:**
You initiate this request from your callback URL. The transaction reference is returned as a query parameter to your callback URL.

**Helpful Tip:**
If you offer digital value like airtime, wallet top-up, digital credit, etc, always confirm that you have not already delivered value for that transaction to avoid double fulfillments, especially, if you also use webhooks.

**Code Example:**
```javascript
const https = require('https')

const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/transaction/verify/:reference',
  method: 'GET',
  headers: {
    Authorization: 'Bearer SECRET_KEY'
  }
}

https.request(options, res => {
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  res.on('end', () => {
    console.log(JSON.parse(data))
  })
}).on('error', error => {
  console.error(error)
})
```

**Response Example:**
```json
{
  "status": true,
  "message": "Verification successful",
  "data": {
    "id": 4099260516,
    "domain": "test",
    "status": "success",
    "reference": "re4lyvq3s3",
    "receipt_number": null,
    "amount": 40333,
    "message": null,
    "gateway_response": "Successful",
    "paid_at": "2024-08-22T09:15:02.000Z",
    "created_at": "2024-08-22T09:14:24.000Z",
    "channel": "card",
    "currency": "NGN",
    "ip_address": "197.210.54.33",
    "metadata": "",
    "log": {
      "start_time": 1724318098,
      "time_spent": 4,
      "attempts": 1,
      "errors": 0,
      "success": true,
      "mobile": false,
      "input": [],
      "history": [
        {
          "type": "action",
          "message": "Attempted to pay with card",
          "time": 3
        },
        {
          "type": "success",
          "message": "Successfully paid with card",
          "time": 4
        }
      ]
    },
    "fees": 10283,
    "fees_split": null,
    "authorization": {
      "authorization_code": "AUTH_uh8bcl3zbn",
      "bin": "408408",
      "last4": "4081",
      "exp_month": "12",
      "exp_year": "2030",
      "channel": "card",
      "card_type": "visa ",
      "bank": "TEST BANK",
      "country_code": "NG",
      "brand": "visa",
      "reusable": true,
      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",
      "account_name": null
    },
    "customer": {
      "id": 181873746,
      "first_name": null,
      "last_name": null,
      "email": "demo@test.com",
      "customer_code": "CUS_1rkzaqsv4rrhqo6",
      "phone": null,
      "metadata": null,
      "risk_action": "default",
      "international_format_phone": null
    },
    "plan": null,
    "split": {},
    "order_id": null,
    "paidAt": "2024-08-22T09:15:02.000Z",
    "createdAt": "2024-08-22T09:14:24.000Z",
    "requested_amount": 30050,
    "pos_transaction_data": null,
    "source": null,
    "fees_breakdown": null,
    "connect": null,
    "transaction_date": "2024-08-22T09:14:24.000Z",
    "plan_object": {},
    "subaccount": {}
  }
}
```

**Warning:**
The API response has a `status` key (`response.status`) indicating the status of the API call. This is **not** the status of the transaction. The status of the transaction is in the `data` object in the verify API response, i.e `response.data.status`.

### Charge Returning Users

The verify response also returns information about the payment instrument that the user paid with in the `data.authorization` object. If the channel is card, then you can store the `authorization_code` for that card against that user, and use that charge the user for subsequent transaction.

---

## Charge Returning Users

### Overview

After a customer has made their first payment, you can store their authorization code and use it to charge them for subsequent transactions without requiring them to enter their card details again.

### Implementation Flow

1. **First Payment**: Customer makes initial payment through Paystack checkout
2. **Store Authorization**: Save the `authorization_code` from the successful transaction response
3. **Subsequent Charges**: Use the stored `authorization_code` with the Charge Authorization API

### Charge Authorization API

**Endpoint:** `POST /transaction/charge_authorization`

**Request Body:**
```json
{
  "authorization_code": "AUTH_pmx3mgawyd",
  "email": "customer@example.com",
  "amount": 300000
}
```

**Important Notes:**
- The `email` must be the same email used when creating the original authorization
- The `amount` should be in the smallest currency unit (kobo for NGN, cents for ZAR, etc.)
- Only use the `authorization_code` if the `reusable` flag is `true`

**Response:**
The response will be similar to the initial charge response, containing transaction details and updated authorization information.

---

## API Endpoints

### Base URL
- **Production:** `https://api.paystack.co`
- **Test:** `https://api.paystack.co` (use test keys)

### Authentication
All API requests require authentication using your secret key:
```
Authorization: Bearer SECRET_KEY
```

### Key Endpoints

#### Initialize Transaction
**Endpoint:** `POST /transaction/initialize`

Creates a new transaction and returns an authorization URL for the customer to complete payment.

#### Verify Transaction
**Endpoint:** `GET /transaction/verify/:reference`

Verifies the status of a transaction using its reference.

#### Charge Authorization
**Endpoint:** `POST /transaction/charge_authorization`

Charges a previously authorized card using the authorization code.

#### Create Plan
**Endpoint:** `POST /plan`

Creates a subscription plan.

#### Create Subscription
**Endpoint:** `POST /subscription`

Creates a subscription for a customer.

#### Fetch Subscription
**Endpoint:** `GET /subscription/:id_or_code`

Retrieves subscription details.

#### Enable/Disable Subscription
**Endpoint:** `POST /subscription/:id_or_code/enable` or `/disable`

Enables or disables a subscription.

#### Generate Subscription Management Link
**Endpoint:** `POST /subscription/:id_or_code/manage/link`

Generates a link for customers to manage their subscriptions.

---

## Webhook Events

### Overview

Paystack sends webhook events to notify your application about transaction status changes and other important events.

### Webhook URL Configuration

Configure your webhook URL in the Paystack Dashboard. For local development, use tools like:
- **ngrok**: `ngrok http 3000`
- **localtunnel**: `npx localtunnel --port 3000`

### Event Types

| Event | Description |
|-------|-------------|
| `charge.success` | Sent when a payment is successful |
| `charge.failed` | Sent when a payment fails |
| `subscription.create` | Sent when a subscription is created |
| `subscription.disable` | Sent when a subscription is disabled |
| `subscription.enable` | Sent when a subscription is enabled |
| `invoice.create` | Sent when an invoice is created |
| `invoice.payment_failed` | Sent when an invoice payment fails |

### Webhook Verification

Always verify webhook signatures to ensure the request is from Paystack:

```typescript
import crypto from 'crypto'

function verifyPaystackSignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex')
  
  return hash === signature
}
```

### Webhook Handler

Your webhook endpoint should:
1. Verify the signature
2. Parse the event data
3. Handle the event type appropriately
4. Return a 200 status code to acknowledge receipt

---

## Trial Subscription Workaround

### Problem

Paystack doesn't support free trial subscriptions directly. To implement a trial period, we use a workaround that involves:

1. Charging a small tokenization amount (R1.00 for ZAR) to tokenize the card
2. Creating the subscription with the authorization code
3. Setting the subscription start date to the trial end date
4. Optionally refunding the tokenization charge

### Implementation Flow

1. **User Initiates Trial:**
   - User clicks "Start Trial"
   - System creates a payment for R1.00 (tokenization charge)
   - User completes payment on Paystack

2. **Webhook Receives Payment:**
   - Webhook detects tokenization charge (R1.00 + `isTokenization` flag)
   - Extracts `authorization_code` from payment response
   - Creates subscription with:
     - Authorization code from tokenization
     - Start date set to trial end date
     - Plan code for the subscription

3. **Subscription Activation:**
   - Subscription is created but not yet active
   - Trial period runs (e.g., 7 days)
   - After trial ends, subscription automatically starts charging

4. **Optional Refund:**
   - System can optionally refund the R1.00 tokenization charge
   - This is done via the Paystack Refund API

### Code Example

```typescript
// In webhook handler
if (isTrialTokenization && planCode && authorizationCode && trialEndDate) {
  // Create subscription with future start date
  const subscription = await PaystackAPIClient.createSubscription({
    customer: customerEmail,
    plan: planCode,
    authorization: authorizationCode,
    start_date: trialEndDate.toISOString()
  })
  
  // Optionally refund tokenization charge
  if (shouldRefundTokenization) {
    await PaystackAPIClient.refundTransaction(transactionReference)
  }
}
```

### Important Notes

- The minimum tokenization amount for ZAR is **R1.00**
- Always check the `reusable` flag before using an authorization code
- Store the email used for tokenization - it must match when creating the subscription
- The subscription will automatically start charging on the specified start date

---

## Environment Variables

Required environment variables for Paystack integration:

```env
PAYSTACK_SECRET_KEY=sk_test_...  # Your Paystack secret key
PAYSTACK_PUBLIC_KEY=pk_test_...   # Your Paystack public key
APP_URL=http://localhost:3000     # Your application URL (for callbacks)
```

---

## Currency Handling

### Amount Conversion

Paystack expects amounts in the smallest currency unit:
- **ZAR (South African Rand)**: Amount in cents (multiply by 100)
- **NGN (Nigerian Naira)**: Amount in kobo (multiply by 100)
- **GHS (Ghanaian Cedi)**: Amount in pesewas (multiply by 100)
- **KES (Kenyan Shilling)**: Amount in cents (multiply by 100)
- **USD (US Dollar)**: Amount in cents (multiply by 100)

### Conversion Functions

```typescript
// Convert ZAR to kobo/cents
export function convertToKobo(amountInZAR: number): number {
  return Math.round(amountInZAR * 100)
}

// Convert kobo/cents to ZAR
export function convertFromKobo(amountInKobo: number): number {
  return amountInKobo / 100
}
```

---

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `400` | Bad Request | Check request parameters |
| `401` | Unauthorized | Verify API keys |
| `402` | Payment Failed | Check card details or insufficient funds |
| `404` | Not Found | Verify resource ID/reference |
| `409` | Conflict | Duplicate transaction (check idempotency) |
| `500` | Server Error | Retry request or contact support |

### Idempotency

Always use idempotency keys for payment requests to prevent duplicate charges:

```typescript
const idempotencyKey = `payment_${userId}_${Date.now()}`
```

---

## Best Practices

1. **Always verify webhook signatures** before processing
2. **Use idempotency keys** for all payment requests
3. **Store authorization codes** securely with the associated email
4. **Check the `reusable` flag** before using authorization codes
5. **Handle 2FA challenges** by redirecting users to authorization URLs
6. **Verify transactions** after redirects, don't rely solely on redirect parameters
7. **Use webhooks** as the primary source of truth for transaction status
8. **Implement retry logic** for failed API calls
9. **Log all payment events** for debugging and reconciliation
10. **Test thoroughly** in sandbox mode before going live

---

## Support

For additional support or questions:
- **Email:** support@paystack.com
- **Documentation:** https://paystack.com/docs
- **API Reference:** https://paystack.com/docs/api

---

## Migration Notes

### From Payfast to Paystack

Key differences to note:
- Paystack uses `reference` instead of `pf_payment_id`
- Amounts are in smallest currency unit (kobo/cents)
- Authorization codes are stored for recurring charges
- Webhook signature verification uses HMAC SHA512
- Subscription management uses enable/disable instead of pause/unpause

---

*Last Updated: 2025-01-14*
*Integration Version: 1.0*

