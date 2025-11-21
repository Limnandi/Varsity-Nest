import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { and, count, desc, eq, sql } from "drizzle-orm"
import { determinePlanForPropertyCount, getPlanById, inferPlanFromAmount, SubscriptionPlan, SubscriptionPlanId } from "@/lib/subscription-plans"

export interface ProviderSubscriptionSummary {
  status: "inactive" | "trial" | "active"
  plan: SubscriptionPlan | null
  isInTrial: boolean
  isEligibleForTrial: boolean
  publishedCount: number
  totalCount: number
  canCreateMore: boolean
  canPublishMore: boolean
  limit: number | null
  nextPlan: SubscriptionPlan
  trialEndsAt?: string | null
}

export async function getProviderSubscriptionSummary(providerId: string): Promise<ProviderSubscriptionSummary> {
  const [provider] = await secureDb.db
    .select({
      subscriptionStatus: schema.providers.subscriptionStatus,
      planId: schema.providers.planId,
      trialStartDate: schema.providers.trialStartDate,
      trialEndDate: schema.providers.trialEndDate,
      nextPaymentDate: schema.providers.nextPaymentDate,
      lastPaymentDate: schema.providers.lastPaymentDate,
    })
    .from(schema.providers)
    .where(eq(schema.providers.id, providerId))
    .limit(1)

  if (!provider) {
    throw new Error("Provider not found")
  }

  const publishedCountResult = await secureDb.db
    .select({ count: count(schema.accommodations.id) })
    .from(schema.accommodations)
    .where(
      and(
        eq(schema.accommodations.providerId, providerId),
        sql`accommodations.is_published = true`
      )
    )

  const totalCountResult = await secureDb.db
    .select({ count: count(schema.accommodations.id) })
    .from(schema.accommodations)
    .where(eq(schema.accommodations.providerId, providerId))

  const publishedCount = Number(publishedCountResult[0]?.count || 0)
  const totalCount = Number(totalCountResult[0]?.count || 0)

  const trialEndsAtDate = provider.trialEndDate ? new Date(provider.trialEndDate) : null
  const isInTrial = provider.subscriptionStatus === "trial" && trialEndsAtDate !== null && trialEndsAtDate > new Date()
  const hasUsedTrial = Boolean(provider.trialStartDate)
  const isEligibleForTrial = !hasUsedTrial

  let plan: SubscriptionPlan | null = null
  let status: ProviderSubscriptionSummary["status"] = "inactive"

  // Use plan_id directly if available (preferred method)
  if (provider.planId && (provider.planId === 'starter' || provider.planId === 'growth' || provider.planId === 'scale')) {
    plan = getPlanById(provider.planId as SubscriptionPlanId)
  } else if (isInTrial) {
    // Trial is always Starter plan
    plan = getPlanById("starter")
    status = "trial"
  } else if (provider.subscriptionStatus === "active") {
    status = "active"
  }

  // Fallback: infer from payment amount if plan_id not set (for backward compatibility)
  if (!plan && provider.subscriptionStatus === "active") {
    const [lastPayment] = await secureDb.db
      .select({
        amount: schema.paymentTransactions.amount,
        createdAt: schema.paymentTransactions.createdAt,
      })
      .from(schema.paymentTransactions)
      .where(and(eq(schema.paymentTransactions.providerId, providerId), eq(schema.paymentTransactions.status, "completed")))
      .orderBy(desc(schema.paymentTransactions.createdAt))
      .limit(1)

    if (lastPayment) {
      const amount = Number(lastPayment.amount)
      plan = inferPlanFromAmount(amount)
      status = status === "inactive" ? "active" : status
    }
  }

  const limit = plan?.maxProperties ?? null
  const canCreateMore = limit === null ? true : totalCount < limit
  const canPublishMore = limit === null ? true : publishedCount < limit
  const nextPlan = determinePlanForPropertyCount(publishedCount + 1)

  return {
    status,
    plan,
    isInTrial,
    isEligibleForTrial,
    publishedCount,
    totalCount,
    canCreateMore,
    canPublishMore,
    limit,
    nextPlan,
    trialEndsAt: trialEndsAtDate ? trialEndsAtDate.toISOString() : null,
  }
}

export interface AgentSubscriptionSummary {
  status: "inactive" | "trial" | "active"
  plan: SubscriptionPlan | null
  isInTrial: boolean
  isEligibleForTrial: boolean
  publishedCount: number
  totalCount: number
  canCreateMore: boolean
  canPublishMore: boolean
  limit: number | null
  nextPlan: SubscriptionPlan
  trialEndsAt?: string | null
}

export async function getAgentSubscriptionSummary(agentId: string): Promise<AgentSubscriptionSummary> {
  const [agent] = await secureDb.db
    .select({
      subscriptionStatus: schema.agents.subscriptionStatus,
      planId: schema.agents.planId,
      trialStartDate: schema.agents.trialStartDate,
      trialEndDate: schema.agents.trialEndDate,
      nextPaymentDate: schema.agents.nextPaymentDate,
      lastPaymentDate: schema.agents.lastPaymentDate,
    })
    .from(schema.agents)
    .where(eq(schema.agents.id, agentId))
    .limit(1)

  if (!agent) {
    throw new Error("Agent not found")
  }

  const publishedCountResult = await secureDb.db
    .select({ count: count(schema.accommodations.id) })
    .from(schema.accommodations)
    .where(
      and(
        eq(schema.accommodations.agentId, agentId),
        sql`accommodations.is_published = true`
      )
    )

  const totalCountResult = await secureDb.db
    .select({ count: count(schema.accommodations.id) })
    .from(schema.accommodations)
    .where(eq(schema.accommodations.agentId, agentId))

  const publishedCount = Number(publishedCountResult[0]?.count || 0)
  const totalCount = Number(totalCountResult[0]?.count || 0)

  const trialEndsAtDate = agent.trialEndDate ? new Date(agent.trialEndDate) : null
  const isInTrial = agent.subscriptionStatus === "trial" && trialEndsAtDate !== null && trialEndsAtDate > new Date()
  const hasUsedTrial = Boolean(agent.trialStartDate)
  const isEligibleForTrial = !hasUsedTrial

  let plan: SubscriptionPlan | null = null
  let status: AgentSubscriptionSummary["status"] = "inactive"

  // Use plan_id directly if available (preferred method)
  if (agent.planId && (agent.planId === 'starter' || agent.planId === 'growth' || agent.planId === 'scale')) {
    plan = getPlanById(agent.planId as SubscriptionPlanId)
  } else if (isInTrial) {
    // Trial is always Starter plan
    plan = getPlanById("starter")
    status = "trial"
  } else if (agent.subscriptionStatus === "active") {
    status = "active"
  }

  // Fallback: infer from payment amount if plan_id not set (for backward compatibility)
  if (!plan && agent.subscriptionStatus === "active") {
    const [lastPayment] = await secureDb.db
      .select({
        amount: schema.paymentTransactions.amount,
        createdAt: schema.paymentTransactions.createdAt,
      })
      .from(schema.paymentTransactions)
      .where(and(eq(schema.paymentTransactions.agentId, agentId), eq(schema.paymentTransactions.status, "completed")))
      .orderBy(desc(schema.paymentTransactions.createdAt))
      .limit(1)

    if (lastPayment) {
      const amount = Number(lastPayment.amount)
      plan = inferPlanFromAmount(amount)
      status = status === "inactive" ? "active" : status
    }
  }

  const limit = plan?.maxProperties ?? null
  const canCreateMore = limit === null ? true : totalCount < limit
  const canPublishMore = limit === null ? true : publishedCount < limit
  const nextPlan = determinePlanForPropertyCount(publishedCount + 1)

  return {
    status,
    plan,
    isInTrial,
    isEligibleForTrial,
    publishedCount,
    totalCount,
    canCreateMore,
    canPublishMore,
    limit,
    nextPlan,
    trialEndsAt: trialEndsAtDate ? trialEndsAtDate.toISOString() : null,
  }
}


