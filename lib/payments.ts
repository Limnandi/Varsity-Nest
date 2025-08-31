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

// Mock payment service - in production, integrate with Stripe
export class PaymentService {
  static async createPaymentIntent(amount: number, currency = "ZAR"): Promise<PaymentIntent> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency,
      status: "requires_payment_method",
      clientSecret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  static async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return {
      id: paymentIntentId,
      amount: 0,
      currency: "ZAR",
      status: "succeeded",
      clientSecret: "",
    }
  }

  static async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return [
      {
        id: "pm_1",
        type: "card",
        last4: "4242",
        brand: "visa",
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: true,
      },
      {
        id: "pm_2",
        type: "card",
        last4: "0005",
        brand: "mastercard",
        expiryMonth: 8,
        expiryYear: 2025,
        isDefault: false,
      },
    ]
  }

  static async createSubscription(customerId: string, priceId: string): Promise<Subscription> {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      id: `sub_${Math.random().toString(36).substr(2, 9)}`,
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 150,
      interval: "month",
    }
  }
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
  const base = input.basePrice ?? 450
  const extra = input.extraSitePrice ?? 50
  const featured = input.featuredPrice ?? 50

  const additionalSites = Math.max(0, (input.accommodationsCount || 0) - 1)
  const total = base + (additionalSites * extra) + (input.wantsFeatured ? featured : 0)
  return Number(total.toFixed(2))
}