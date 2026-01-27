"use client"

import { X, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { SubscriptionPlanId, SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"
import { useRef } from "react"
import { useModalA11y } from "@/hooks/useModalA11y"

interface PlanSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  entityType?: 'provider' | 'agent'
  subscriptionSummary?: {
    isEligibleForTrial: boolean
    isInTrial: boolean
    publishedCount: number
    totalCount: number
  } | null
}

const PLAN_FEATURES: Record<SubscriptionPlanId, string[]> = {
  starter: [
    "Publish up to 5 properties",
    "14-day free trial",
    "Basic analytics",
  ],
  growth: [
    "Publish up to 9 properties",
    "Advanced analytics",
    "Priority support",
  ],
  scale: [
    "Unlimited properties",
    "Premium analytics suite",
    "Dedicated account manager",
  ],
}

export default function PlanSelectionModal({
  isOpen,
  onClose,
  entityType = 'provider',
  subscriptionSummary,
}: PlanSelectionModalProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)

  useModalA11y({ isOpen, containerRef: dialogRef, onClose })

  const hasActiveSubscription = subscriptionSummary?.isInTrial || false
  const isEligibleForTrial = subscriptionSummary?.isEligibleForTrial ?? false

  const handlePlanSelect = (planId: SubscriptionPlanId) => {
    const paymentPath = entityType === 'agent' 
      ? `/agent/billing/payment?planId=${planId}`
      : `/provider/billing/payment?planId=${planId}`
    router.push(paymentPath)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Choose your subscription plan"
        className="relative border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          aria-label="Close plan selection"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-white">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Choose Your Plan
            </h2>
            <p className="text-neutral-300 text-lg">
              Select a subscription plan to start publishing your properties
            </p>
          </div>

          {/* Trial Banner */}
          {isEligibleForTrial && (
            <div className="mb-6 p-4 border border-green-500/50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-300 mb-1">14-Day Free Trial Available</h3>
                  <p className="text-sm text-green-200">
                    Start with the Starter plan and get 14 days free. No payment required until after the trial period ends.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
              const isStarter = plan.id === 'starter'
              const showStartTrialButton = isStarter && !hasActiveSubscription && isEligibleForTrial
              const featureList = PLAN_FEATURES[plan.id] ?? []

              return (
                <div
                  key={plan.id}
                  className="relative border rounded-2xl p-6 flex flex-col h-full transition-all duration-300 border-white/10 bg-white/5 hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm text-neutral-400">Plan</p>
                      <p className="text-2xl font-semibold text-white">{plan.name}</p>
                    </div>
                    {isStarter && isEligibleForTrial && !hasActiveSubscription && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 border border-green-400/40 text-green-100">
                        Trial available
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-neutral-400 mb-4">{plan.description}</p>

                  <div className="mb-4">
                    <p className="text-4xl font-bold text-white">R{plan.price.toFixed(2)}</p>
                    <p className="text-sm text-neutral-400">per month</p>
                  </div>

                  <p className="text-sm text-neutral-300 mb-4">
                    {plan.maxProperties === null
                      ? 'Unlimited properties'
                      : `Up to ${plan.maxProperties} properties`}
                  </p>

                  <ul className="space-y-3 text-sm text-neutral-200 mb-6 flex-grow">
                    {featureList.map((feature) => (
                      <li key={`${plan.id}-${feature}`} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {showStartTrialButton ? (
                      <button
                        onClick={() => handlePlanSelect(plan.id)}
                        className="w-full py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20"
                      >
                        Start Free Trial
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePlanSelect(plan.id)}
                        className="w-full py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
                      >
                        Choose {plan.name}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              All plans include access to the Varsity Nest platform and customer support
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

