export type SubscriptionPlanId = "starter" | "growth" | "scale"

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  description: string
  price: number
  maxProperties: number | null
  hasTrial: boolean
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Publish up to 5 properties",
    price: 299.9,
    maxProperties: 5,
    hasTrial: true,
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "Publish up to 9 properties",
    price: 499.9,
    maxProperties: 9,
    hasTrial: false,
  },
  scale: {
    id: "scale",
    name: "Scale",
    description: "Unlimited properties",
    price: 799.9,
    maxProperties: null,
    hasTrial: false,
  },
}

export function getPlanById(planId: SubscriptionPlanId): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId]
}

export function determinePlanForPropertyCount(count: number): SubscriptionPlan {
  if (count <= SUBSCRIPTION_PLANS.starter.maxProperties!) {
    return SUBSCRIPTION_PLANS.starter
  }
  if (count <= SUBSCRIPTION_PLANS.growth.maxProperties!) {
    return SUBSCRIPTION_PLANS.growth
  }
  return SUBSCRIPTION_PLANS.scale
}

export function inferPlanFromAmount(amount: number): SubscriptionPlan {
  if (amount >= SUBSCRIPTION_PLANS.scale.price - 0.5) {
    return SUBSCRIPTION_PLANS.scale
  }
  if (amount >= SUBSCRIPTION_PLANS.growth.price - 0.5) {
    return SUBSCRIPTION_PLANS.growth
  }
  return SUBSCRIPTION_PLANS.starter
}


