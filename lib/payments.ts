// Payment types and utilities
export interface PaymentMethod {
  id: string
  type: "card" | "bank_account"
  last4: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: "requires_payment_method" | "requires_confirmation" | "succeeded" | "canceled"
  clientSecret: string
}

export interface Subscription {
  id: string
  status: "active" | "past_due" | "canceled" | "incomplete"
  currentPeriodStart: string
  currentPeriodEnd: string
  amount: number
  interval: "month" | "year"
}

// Removed mock PaymentService in favor of production PayFast flow handled via
// server endpoints and lib/payfast.ts. Retained pricing helpers below.

// Pricing helpers for provider subscription
export interface ProviderPricingInput {
  basePrice?: number // default 450
  extraSitePrice?: number // default 50 per additional accommodation
  featuredPrice?: number // default 50
  accommodationsCount: number
  wantsFeatured: boolean
}

export function calculateProviderSubscriptionPrice(input: ProviderPricingInput): number {
  const base = input.basePrice ?? 450
  const extra = input.extraSitePrice ?? 50
  const featured = input.featuredPrice ?? 50

  const additionalSites = Math.max(0, (input.accommodationsCount || 0) - 1)
  const total = base + (additionalSites * extra) + (input.wantsFeatured ? featured : 0)
  return Number(total.toFixed(2))
}