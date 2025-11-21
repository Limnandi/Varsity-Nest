import { SubscriptionPlanId, determinePlanForPropertyCount, getPlanById } from "./subscription-plans"

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
  planId?: SubscriptionPlanId
  accommodationsCount?: number
  wantsFeatured?: boolean
}

export function calculateProviderSubscriptionPrice(input: ProviderPricingInput): number {
  const plan = input.planId
    ? getPlanById(input.planId)
    : determinePlanForPropertyCount(Math.max(1, input.accommodationsCount ?? 1))

  return Number(plan.price.toFixed(2))
}