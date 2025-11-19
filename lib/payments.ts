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



// Pricing helpers for provider subscription
export interface ProviderPricingInput {
  basePrice?: number // default 450
  extraSitePrice?: number // default 50 per additional accommodation
  featuredPrice?: number // default 50
  accommodationsCount: number
  wantsFeatured: boolean
}

export function calculateProviderSubscriptionPrice(input: ProviderPricingInput): number {
  // First accommodation: R199.90
  // Each additional accommodation: R89.90
  const firstAccommodationPrice = 199.90
  const additionalAccommodationPrice = 89.90
  const featured = input.featuredPrice ?? 0

  const accommodationsCount = input.accommodationsCount || 0
  
  if (accommodationsCount === 0) {
    return firstAccommodationPrice
  }
  
  // First accommodation is R199.90, each additional is R89.90
  const additionalCount = Math.max(0, accommodationsCount - 1)
  const total = firstAccommodationPrice + (additionalCount * additionalAccommodationPrice) + (input.wantsFeatured ? featured : 0)
  return Number(total.toFixed(2))
}