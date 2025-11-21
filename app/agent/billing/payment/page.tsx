"use client"

import { useState, useEffect, useMemo } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import PaystackPaymentForm from "@/components/PaystackPaymentForm"
import { ArrowLeft, CreditCard, Shield, CheckCircle, AlertCircle, RefreshCw, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { SubscriptionPlanId } from "@/lib/subscription-plans"

interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  description: string
  price: number
  maxProperties: number | null
  hasTrial: boolean
}

interface BillingSubscriptionSummary {
  plan: SubscriptionPlan | null
  status: 'inactive' | 'trial' | 'active'
  isInTrial: boolean
  isEligibleForTrial: boolean
  publishedCount: number
  totalCount: number
  canCreateMore: boolean
  canPublishMore: boolean
  nextPlan: SubscriptionPlan
  limit: number | null
}

interface BillingData {
  agent: {
    id: string
    email: string
    businessName: string
    contactPerson: string
    subscriptionToken: string | null
    billingInfo: {
      monthlyFee: number
      nextPaymentDate: string
      subscriptionStatus: string
      subscriptionStartDate: string
      trialStartDate?: string | null
      trialEndDate?: string | null
      isInTrial?: boolean
      isFirstTimeUser?: boolean
      planId: SubscriptionPlanId
      planName: string
      planDescription: string
      planPrice: number
      planLimit: number | null
    }
  }
  invoices: any[]
  plans: SubscriptionPlan[]
  subscriptionSummary: BillingSubscriptionSummary
}

export default function AgentPaymentPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setError(null)
        const response = await fetch('/api/agent/billing', {
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `Failed to fetch billing data (${response.status})`)
        }

        const data = await response.json()
        setBillingData(data)
      } catch (err) {
        console.error('Billing data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load billing data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBillingData()
  }, [])

  const handlePaymentSuccess = () => {
    // Payment form will handle the redirect to PayStack
  }

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error)
    setError(error)
  }

  const plans = useMemo(() => billingData?.plans || [], [billingData?.plans])
  const subscriptionSummary = billingData?.subscriptionSummary
  const selectedPlanIdFromQuery = (searchParams.get("planId") as SubscriptionPlanId | null) ?? null

  const selectedPlan = useMemo(() => {
    if (plans.length === 0) return null
    if (selectedPlanIdFromQuery) {
      const match = plans.find((plan) => plan.id === selectedPlanIdFromQuery)
      if (match) {
        return match
      }
    }
    if (subscriptionSummary?.plan) {
      const summaryPlan = plans.find((plan) => plan.id === subscriptionSummary.plan!.id)
      if (summaryPlan) {
        return summaryPlan
      }
      return subscriptionSummary.plan
    }
    const fallbackPlanId = billingData?.agent?.billingInfo?.planId
    return plans.find((plan) => plan.id === fallbackPlanId) || plans[0]
  }, [plans, selectedPlanIdFromQuery, subscriptionSummary, billingData?.agent?.billingInfo?.planId])

  if (isLoading) {
    return (
      <AuthGuard requiredRole="agent">
        <DashboardLayout userRole="agent">
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-white mb-2">Loading Payment Details</h2>
              <p className="text-neutral-300">Please wait while we prepare your payment form...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error || !billingData) {
    return (
      <AuthGuard requiredRole="agent">
        <DashboardLayout userRole="agent">
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-4 w-16 h-16 border border-red-500/50 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Payment Details</h2>
              <p className="text-neutral-400 mb-6">{error || 'Failed to load billing data'}</p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/agent/billing"
                  className="px-6 py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Billing
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  const agent = billingData.agent

  const planIdForPayment = selectedPlan?.id ?? agent.billingInfo.planId
  const planName = selectedPlan?.name ?? agent.billingInfo.planName
  const planPrice = selectedPlan?.price ?? agent.billingInfo.planPrice ?? agent.billingInfo.monthlyFee
  const planLimitLabel = selectedPlan
    ? selectedPlan.maxProperties === null
      ? "Unlimited properties"
      : `Up to ${selectedPlan.maxProperties} properties`
    : agent.billingInfo.planDescription
  const isEligibleForTrial = Boolean(subscriptionSummary?.isEligibleForTrial && selectedPlan?.hasTrial)
  const isInTrial = Boolean(subscriptionSummary?.isInTrial || agent.billingInfo.isInTrial)

  return (
    <AuthGuard requiredRole="agent">
      <DashboardLayout userRole="agent">
        <div className="space-y-8 p-6 text-white">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/20">
            <Link 
              href="/agent/billing" 
              className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Billing
            </Link>
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Complete Payment
            </h1>
            <p className="text-neutral-300 text-lg">
              Secure your subscription with our trusted payment partner
            </p>
          </div>

          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-400">Selected Plan</p>
                <p className="text-2xl font-bold text-white">{planName}</p>
                <p className="text-sm text-neutral-400">{planLimitLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">R{planPrice.toFixed(2)}</p>
                <p className="text-sm text-neutral-400">per month</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-red-500/50 bg-red-500/10 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-300">Payment Error</p>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* First-Time User Trial Offer */}
          {isEligibleForTrial && (
            <div className="relative border border-green-500/30 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-green-500/30 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 border border-green-500/50 bg-green-500/20 rounded-2xl shadow-lg">
                      <CheckCircle className="w-8 h-8 text-green-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-1">
                        Start Your Free Trial
                      </h2>
                      <p className="text-sm text-green-200/80">14 days free, then R{planPrice.toFixed(2)}/month</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-green-500/30 border border-green-400/50 rounded-full text-sm font-semibold text-green-200">
                    NEW USER
                  </span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-black/20 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-lg font-semibold text-white">Trial Period</p>
                      <p className="text-3xl font-bold text-green-300">FREE</p>
                    </div>
                    <div className="space-y-2 text-sm text-neutral-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>14 days of full access - completely free</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Cancel anytime during trial - no charges</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-200">
                        <span className="font-semibold">Note:</span> A R1.00 card verification charge will be processed to verify your payment method. This amount will be <span className="font-semibold">refunded immediately</span> after verification.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-lg font-semibold text-white">After Trial Ends</p>
                      <p className="text-2xl font-bold text-blue-300">R{planPrice.toFixed(2)}<span className="text-base font-medium text-neutral-400">/month</span></p>
                    </div>
                    <p className="text-sm text-neutral-300">
                      Your subscription will automatically start after the 14-day trial period ends. 
                      You can set up payment details now, and billing will begin only after your trial expires.
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-center text-green-200/70">
                  By proceeding with payment, you agree that billing will begin automatically after 14 days
                </p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
                <PaystackPaymentForm
                  amount={planPrice}
                  userEmail={agent.email}
                  userName={agent.contactPerson}
                  itemName={`Varsity Nest ${planName} Subscription - ${agent.businessName}`}
                  customData={{
                    agentId: agent.id,
                    subscriptionType: "monthly",
                    planId: planIdForPayment,
                  }}
                  planId={planIdForPayment}
                  isEligibleForTrial={isEligibleForTrial}
                  isInTrial={isInTrial}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            </div>

            {/* Payment Summary & Security */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-green-500/10">
                <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  Payment Summary
                </h2>
                <div className="space-y-4">
                  {isInTrial && agent.billingInfo.trialEndDate ? (
                    <>
                      <div>
                        <p className="text-sm text-neutral-300 mb-2">Trial Period</p>
                        <div className="space-y-2">
                          <p className="text-2xl font-bold text-green-400">
                            FREE
                            <span className="text-lg font-medium text-neutral-400 ml-2">14 Days</span>
                          </p>
                          <div className="flex items-center gap-2 text-sm text-blue-300">
                            <Clock className="w-4 h-4" />
                            <span>
                              Trial ends: {new Date(agent.billingInfo.trialEndDate).toLocaleDateString()}
                    </span>
                  </div>
                          {(() => {
                            const endDate = new Date(agent.billingInfo.trialEndDate!)
                            const now = new Date()
                            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                            return daysRemaining > 0 ? (
                              <p className="text-xs text-neutral-400">
                                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                              </p>
                            ) : null
                          })()}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-neutral-400 mb-1">
                        After trial ends, monthly subscription: R{planPrice.toFixed(2)}/month
                        </p>
                        <p className="text-xs text-blue-300 font-medium">
                          Billing will start automatically after trial period ends
                        </p>
                  </div>
                    </>
                  ) : isEligibleForTrial ? (
                    <>
                      <div>
                        <p className="text-sm text-neutral-300 mb-2">Starting Trial</p>
                        <div className="space-y-2">
                          <p className="text-2xl font-bold text-green-400">
                            FREE
                            <span className="text-lg font-medium text-neutral-400 ml-2">14 Days</span>
                          </p>
                          <p className="text-xs text-neutral-400">
                            No payment required to start your trial
                          </p>
                  </div>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-neutral-400 mb-1">
                        After trial ends: R{planPrice.toFixed(2)}/month
                        </p>
                        <p className="text-xs text-blue-300 font-medium">
                          Billing will start automatically after 14 days
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-neutral-300 mb-2">Subscription Amount</p>
                        <p className="text-4xl font-bold">
                          R{planPrice.toFixed(2)}
                          <span className="text-lg font-medium text-neutral-400">/30 days</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Calendar className="w-4 h-4" />
                        <span>Next payment: {new Date(agent.billingInfo.nextPaymentDate).toLocaleDateString()}</span>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-neutral-400">
                          Amount calculated based on your active accommodations
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

            {/* Security Features */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                <Shield className="w-6 h-6 text-purple-400" />
                Security Features
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-300">256-bit SSL encryption</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-300">PCI DSS compliant</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-300">Secure payment processing</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-300">No card data stored</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-blue-500/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                <CreditCard className="w-6 h-6 text-blue-400" />
                Accepted Payment Methods
              </h2>
              <div className="space-y-3 text-sm text-neutral-300">
                <p>• Credit Cards (Visa, Mastercard, American Express)</p>
                <p>• Debit Cards</p>
                <p>• EFT (Electronic Funds Transfer)</p>
                <p>• Instant EFT</p>
                <p>• Bank Transfer</p>
              </div>
            </div>

            {/* Support */}
            <div className="relative border border-blue-500/30 bg-blue-500/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
              <h3 className="font-bold text-blue-300 mb-3 text-lg">Need Help?</h3>
              <p className="text-sm text-blue-200 mb-4">
                Our support team is here to help with any payment questions.
              </p>
              <a 
                href="mailto:support@varsitynest.co.za" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-all duration-300 text-sm font-medium"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}
