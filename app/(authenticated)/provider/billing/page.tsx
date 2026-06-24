"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { 
  CreditCard, 
  Download, 
  AlertCircle, 
  Calendar, 
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Info,
  Settings
} from "lucide-react"
import jsPDF from "jspdf"
// Import jspdf-autotable to extend jsPDF prototype
import "jspdf-autotable"

// TypeScript interfaces for type safety
import type { SubscriptionPlanId } from "@/lib/subscription-plans"

interface BillingInfo {
  monthlyFee: number
  nextPaymentDate: string
  subscriptionStatus: 'active' | 'inactive' | 'suspended' | 'trial'
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
  publishedCount?: number
  totalProperties?: number
  canCreateMore?: boolean
  canPublishMore?: boolean
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  description: string
  paymentMethod?: string
}

interface ProviderData {
  id: string
  email: string
  businessName: string
  contactPerson: string
  subscriptionToken: string | null
  billingInfo: BillingInfo
}

interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  description: string
  price: number
  maxProperties: number | null
  hasTrial: boolean
}

interface ProviderBillingResponse {
  provider: ProviderData
  invoices: Invoice[]
  plans: SubscriptionPlan[]
  subscriptionSummary: {
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
}

const PLAN_FEATURES: Record<SubscriptionPlanId, string[]> = {
  starter: [
    "Up to 5 published properties",
    "14-day free trial",
    "Basic analytics dashboard",
  ],
  growth: [
    "Up to 9 published properties",
    "Advanced analytics & insights",
    "Priority email support",
  ],
  scale: [
    "Unlimited published properties",
    "Premium analytics suite",
    "Dedicated account manager",
  ],
}

interface SubscriptionDetails {
  token: string
  status: 'active' | 'paused' | 'cancelled'
  cycles: number
  frequency: number
  amount: number
  item_name: string
  billing_date: string
  next_run_date: string
  is_active: boolean
  is_paused: boolean
  is_cancelled: boolean
}

export default function ProviderBilling() {
  const router = useRouter()
  const [provider, setProvider] = useState<ProviderData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscriptionSummary, setSubscriptionSummary] = useState<ProviderBillingResponse["subscriptionSummary"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [isManagingSubscription, setIsManagingSubscription] = useState(false)
  const [isNavigatingToPayment, setIsNavigatingToPayment] = useState(false)
  const [isGeneratingManagementLink, setIsGeneratingManagementLink] = useState(false)
  const handlePlanSelect = useCallback((planId: SubscriptionPlanId) => {
    router.push(`/provider/billing/payment?planId=${planId}`)
  }, [router])

  const fetchSubscriptionDetails = useCallback(async (token: string) => {
    try {
      setIsLoadingSubscription(true)
      setSubscriptionError(null)
      const response = await fetch(`/api/subscriptions/${token}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        // If subscription not found (404), it might not be available yet - don't show as error
        if (response.status === 404) {
          setSubscriptionError(null) // Clear error for 404 - subscription might not be ready yet
          return
        }
        
        throw new Error(errorData.error || errorData.details || `Failed to fetch subscription details (${response.status})`)
      }

      const data = await response.json()
      if (data.success && data.subscription) {
        setSubscriptionDetails(data.subscription)
        setSubscriptionError(null) // Clear any previous errors
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription details'
      setSubscriptionError(errorMessage)
    } finally {
      setIsLoadingSubscription(false)
    }
  }, [])

  const fetchProviderData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/provider/billing', {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to fetch billing data (${response.status})`)
      }

      const data: ProviderBillingResponse = await response.json()
      setProvider(data.provider)
      setInvoices(data.invoices || [])
      setPlans(data.plans || [])
      setSubscriptionSummary(data.subscriptionSummary || null)
      
      if (data.provider.subscriptionToken) {
        fetchSubscriptionDetails(data.provider.subscriptionToken)
      }
    } catch (err) {
      console.error('Billing data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load billing data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [fetchSubscriptionDetails])

  useEffect(() => {
    fetchProviderData()
  }, [fetchProviderData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchProviderData()
  }

  const handleCancelSubscription = async () => {
    if (!provider?.subscriptionToken) return

    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return
    }

    try {
      setIsManagingSubscription(true)
      setSubscriptionError(null)
      const response = await fetch(`/api/subscriptions/${provider.subscriptionToken}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to cancel subscription')
      }

      // Refresh billing data
      await fetchProviderData()
      setSubscriptionDetails(null)
    } catch (err) {
      console.error('Cancel subscription error:', err)
      setSubscriptionError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setIsManagingSubscription(false)
    }
  }

  const handleOpenManagementLink = async () => {
    // Use subscriptionToken from provider, or subscription code from subscriptionDetails
    let subscriptionCode = provider?.subscriptionToken || subscriptionDetails?.token
    
    // If no subscription code but provider is in trial, try to find it
    if (!subscriptionCode && (provider?.billingInfo.isInTrial || provider?.billingInfo.subscriptionStatus === 'trial')) {
      try {
        const findResponse = await fetch('/api/subscriptions/find-by-email', {
          credentials: 'include'
        })
        if (findResponse.ok) {
          const findData = await findResponse.json()
          if (findData.success && findData.subscriptionCode) {
            subscriptionCode = findData.subscriptionCode
            // Update provider state with found subscription code
            if (provider && subscriptionCode) {
              setProvider({ ...provider, subscriptionToken: subscriptionCode || null })
            }
            // Fetch subscription details
            if (subscriptionCode) {
              fetchSubscriptionDetails(subscriptionCode)
            }
          }
        }
      } catch (findError) {
        // Silently fail - will show error below
      }
    }
    
    if (!subscriptionCode) {
      setSubscriptionError('Subscription not found. Please refresh the page or contact support.')
      return
    }

    try {
      setIsGeneratingManagementLink(true)
      setSubscriptionError(null)
      
      const response = await fetch(`/api/subscriptions/${subscriptionCode}/manage-link`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to generate management link')
      }

      const data = await response.json()
      if (data.success && data.link) {
        // Open the management link in a new tab
        window.open(data.link, '_blank', 'noopener,noreferrer')
      } else {
        throw new Error('No management link received')
      }
    } catch (err) {
      console.error('Generate management link error:', err)
      setSubscriptionError(err instanceof Error ? err.message : 'Failed to open management link')
    } finally {
      setIsGeneratingManagementLink(false)
    }
  }

  const exportInvoice = (invoice: Invoice) => {
    if (!provider) return

    // Ensure jspdf-autotable is loaded (it extends jsPDF prototype)
    try {
      // Force import if not already loaded
      if (typeof window !== 'undefined' && !(jsPDF.prototype as any).autoTable) {
        // @ts-ignore
        require("jspdf-autotable")
      }
    } catch (e) {
      console.warn("jspdf-autotable not available, using fallback")
    }

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.text("Tax Invoice", 105, 20, { align: "center" })

    // Company Details
    doc.setFontSize(12)
    doc.text("Varsity Nest (Pty) Ltd", 14, 40)
    doc.text("123 Tech Avenue, Sandton", 14, 46)
    doc.text("Johannesburg, 2196", 14, 52)
    doc.text("VAT: 4123456789", 14, 58)

    // Client Details
    doc.text("Bill To:", 14, 80)
    doc.text(provider.businessName, 14, 86)
    doc.text(provider.contactPerson, 14, 92)
    doc.text(provider.email, 14, 98)

    // Invoice Details
    doc.text(`Invoice #: ${invoice.id}`, 196, 80, { align: "right" })
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 196, 86, { align: "right" })
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 196, 92, { align: "right" })

    // Invoice Table - Check if autoTable is available
    let finalY: number
    if (typeof (doc as any).autoTable === 'function') {
      // @ts-ignore - autoTable is added to jsPDF by jspdf-autotable
      doc.autoTable({
        startY: 110,
        head: [["Description", "Quantity", "Unit Price", "Total"]],
        body: [[invoice.description, "1", `R ${invoice.amount.toFixed(2)}`, `R ${invoice.amount.toFixed(2)}`]],
        theme: "striped",
      })
      // @ts-ignore - lastAutoTable is added by jspdf-autotable
      finalY = (doc as any).lastAutoTable?.finalY || 110
    } else {
      // Fallback: Draw table manually if autoTable is not available
      doc.setFontSize(10)
      doc.text("Description", 14, 110)
      doc.text("Quantity", 100, 110)
      doc.text("Unit Price", 140, 110)
      doc.text("Total", 180, 110)
      doc.line(14, 115, 196, 115)
      doc.text(invoice.description, 14, 122)
      doc.text("1", 100, 122)
      doc.text(`R ${invoice.amount.toFixed(2)}`, 140, 122)
      doc.text(`R ${invoice.amount.toFixed(2)}`, 180, 122)
      finalY = 130
    }
    doc.setFontSize(14)
    doc.text(`Total: R ${invoice.amount.toFixed(2)}`, 196, finalY + 15, { align: "right" })

    // Footer
    doc.setFontSize(10)
    doc.text("Thank you for your business!", 105, finalY + 35, { align: "center" })

    doc.save(`Invoice-${invoice.id}.pdf`)
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'border-green-500/50 bg-green-500/10 text-green-400'
      case 'pending':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
      case 'failed':
        return 'border-red-500/50 bg-red-500/10 text-red-400'
      case 'refunded':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400'
      default:
        return 'border-gray-500/50 bg-gray-500/10 text-gray-400'
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-3 h-3" />
      case 'pending':
        return <Clock className="w-3 h-3" />
      case 'failed':
        return <XCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const getSubscriptionStatusColor = (status: BillingInfo['subscriptionStatus']) => {
    switch (status) {
      case 'active':
        return 'border-green-500/50 bg-green-500/10 text-green-300'
      case 'trial':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-300'
      case 'suspended':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-300'
      case 'inactive':
        return 'border-red-500/50 bg-red-500/10 text-red-300'
      default:
        return 'border-gray-500/50 bg-gray-500/10 text-gray-300'
    }
  }

  const currentPlanId = provider?.billingInfo.planId ?? null
  const currentPlan = useMemo(() => {
    if (!currentPlanId) {
      return subscriptionSummary?.plan ?? null
    }
    return plans.find((plan) => plan.id === currentPlanId) || subscriptionSummary?.plan || null
  }, [currentPlanId, plans, subscriptionSummary])

  const planLimit = provider?.billingInfo.planLimit ?? currentPlan?.maxProperties ?? null
  const publishedCount = provider?.billingInfo.publishedCount ?? subscriptionSummary?.publishedCount ?? 0
  const totalProperties = provider?.billingInfo.totalProperties ?? subscriptionSummary?.totalCount ?? publishedCount
  const planUsagePercent = planLimit ? Math.min(100, Math.round((publishedCount / planLimit) * 100)) : 100
  const slotsRemaining = planLimit === null ? null : Math.max(planLimit - publishedCount, 0)
  const nextPlan = subscriptionSummary?.nextPlan && subscriptionSummary.nextPlan.id !== currentPlanId
    ? subscriptionSummary.nextPlan
    : null
  const isAtLimit = planLimit !== null && publishedCount >= planLimit
  const recommendedPlanId = nextPlan?.id ?? null

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard requiredRole="provider">
        <DashboardLayout userRole="provider">
          <div className="space-y-6 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  // Error state
  if (error) {
    return (
      <AuthGuard requiredRole="provider">
        <DashboardLayout userRole="provider">
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-4 w-16 h-16 border border-red-500/50 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Billing Data</h2>
              <p className="text-neutral-400 mb-6">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!provider) {
    return null
  }

  // Pending amount should be the monthly fee (based on accommodations) if subscription is not active
  // NOT the sum of all payment attempts
  const hasActiveSubscription = provider.billingInfo.subscriptionStatus === 'active'
  const pendingAmount = hasActiveSubscription ? 0 : provider.billingInfo.planPrice

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="space-y-4 sm:space-y-8 p-4 sm:p-6 overflow-x-hidden">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-blue-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">
                  Billing & Subscriptions
                </h1>
                <p className="text-neutral-300 text-sm sm:text-lg break-words">{provider.businessName}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/20 disabled:opacity-50 text-xs sm:text-sm w-full sm:w-auto justify-center break-words"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="break-words">Refresh</span>
              </button>
            </div>
          </div>

          {/* Compare Plans Grid - Moved to top position */}
          {plans.length > 0 && (
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-purple-500/10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    Compare Plans
                  </h2>
                  <p className="text-sm text-neutral-400">Pick the plan that matches your property portfolio.</p>
                </div>
                {nextPlan && (
                  <button
                    onClick={() => handlePlanSelect(nextPlan.id)}
                    className="px-4 py-2 rounded-xl border border-purple-500/50 text-sm font-semibold bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-300"
                  >
                    Upgrade to {nextPlan.name}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {plans.map((plan) => {
                  const isCurrent = plan.id === currentPlanId
                  const isRecommended = recommendedPlanId === plan.id
                  const exceedsPlan = plan.maxProperties !== null && totalProperties > plan.maxProperties
                  const trialBadge = plan.hasTrial && subscriptionSummary?.isEligibleForTrial
                  const featureList = PLAN_FEATURES[plan.id] ?? []
                  const hasActiveSubscription = provider.billingInfo.subscriptionStatus === 'active' || provider.billingInfo.subscriptionStatus === 'trial'
                  const showStartTrialButton = plan.id === 'starter' && !hasActiveSubscription && subscriptionSummary?.isEligibleForTrial
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-2xl p-5 flex flex-col h-full ${
                        isCurrent ? 'border-blue-500/60 bg-blue-500/10 shadow-blue-500/20' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-neutral-400">Plan</p>
                          <p className="text-xl font-semibold text-white">{plan.name}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {isCurrent && (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-100">
                              Current
                            </span>
                          )}
                          {isRecommended && (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-100">
                              Recommended
                            </span>
                          )}
                          {trialBadge && (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 border border-green-400/40 text-green-100">
                              Trial available
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-400 mt-2">{plan.description}</p>
                      <div className="mt-4 mb-4">
                        <p className="text-3xl font-bold text-white">R{plan.price.toFixed(2)}</p>
                        <p className="text-sm text-neutral-400">per month</p>
                      </div>
                      <p className="text-sm text-neutral-300 mb-4">
                        {plan.maxProperties === null
                          ? 'Unlimited properties'
                          : `Up to ${plan.maxProperties} properties`}
                      </p>
                      <ul className="space-y-3 text-sm text-neutral-200 mb-6">
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
                            disabled={isCurrent || exceedsPlan}
                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                              isCurrent
                                ? 'bg-white/10 text-white cursor-default'
                                : exceedsPlan
                                  ? 'bg-white/5 text-neutral-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20'
                            }`}
                          >
                            {isCurrent
                              ? 'Current plan'
                              : exceedsPlan
                                ? 'Reduce properties to downgrade'
                                : `Choose ${plan.name}`}
                          </button>
                        )}
                        {exceedsPlan && (
                          <p className="text-xs text-red-300 mt-2">
                            You have {totalProperties} properties. This plan allows {plan.maxProperties} max.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Current Plan */}
            <div className="group relative border border-white/10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 border border-blue-500/50 bg-blue-500/10 rounded-xl shadow-lg">
                  <DollarSign className="w-6 h-6 text-blue-300" />
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getSubscriptionStatusColor(provider.billingInfo.subscriptionStatus)}`}>
                  {provider.billingInfo.subscriptionStatus.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                {provider.billingInfo.isInTrial && provider.billingInfo.trialEndDate ? (
                  <>
                    <p className="text-sm text-neutral-300">Trial Period</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-400">
                        FREE
                        <span className="text-lg font-medium text-neutral-400 ml-2">14 Days</span>
                      </p>
                      <div className="flex items-center gap-2 text-sm text-blue-300">
                        <Clock className="w-4 h-4" />
                        <span>
                          Trial ends: {new Date(provider.billingInfo.trialEndDate).toLocaleDateString()}
                        </span>
                      </div>
                      {(() => {
                        const endDate = new Date(provider.billingInfo.trialEndDate!)
                        const now = new Date()
                        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        return daysRemaining > 0 ? (
                          <p className="text-xs text-neutral-400">
                            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                          </p>
                        ) : null
                      })()}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-neutral-400">
                        After trial ends, monthly subscription: R{provider.billingInfo.planPrice.toFixed(2)}/month
                      </p>
                      <p className="text-xs text-blue-300 mt-1 font-medium">
                        Billing will start automatically after trial period ends
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-neutral-300">Subscription Amount</p>
                    <p className="text-4xl font-bold">
                      R{provider.billingInfo.planPrice.toFixed(2)}
                      <span className="text-lg font-medium text-neutral-400">/month</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Calendar className="w-4 h-4" />
                      <span>Next payment: {new Date(provider.billingInfo.nextPaymentDate).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-neutral-400">
                        Amount calculated based on your active accommodations
                      </p>
                    </div>
                  </>
                )}
              </div>
              {!provider.billingInfo.isInTrial && !provider.billingInfo.isFirstTimeUser && (
                <button 
                  onClick={() => {
                    setIsNavigatingToPayment(true)
                    router.push("/provider/billing/payment")
                  }}
                  disabled={isNavigatingToPayment}
                  className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isNavigatingToPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Make Payment"
                  )}
                </button>
              )}
            </div>

            {/* Pending Payments */}
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 border border-orange-500/50 bg-orange-500/10 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-neutral-300">Pending Amount</p>
                <p className="text-4xl font-bold">R{pendingAmount.toFixed(2)}</p>
                <p className="text-xs text-neutral-400">{invoices.filter(i => i.status === 'pending').length} pending</p>
              </div>
            </div>
          </div>

        {subscriptionSummary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-300">Plan usage</p>
                  <p className="text-2xl font-bold text-white">{provider.billingInfo.planName}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  isAtLimit
                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                    : planLimit === null
                      ? 'border-green-500/50 bg-green-500/10 text-green-300'
                      : 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                }`}>
                  {planLimit === null ? 'Unlimited' : isAtLimit ? 'Limit reached' : `${slotsRemaining} slots left`}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-2">{provider.billingInfo.planDescription}</p>

              {planLimit === null ? (
                <p className="mt-4 text-sm text-green-300">You can publish unlimited properties on this plan.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mt-4">
                    <span>{publishedCount} published</span>
                    <span>{planLimit} limit</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isAtLimit ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(planUsagePercent, 100)}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-2 ${isAtLimit ? 'text-red-300' : 'text-neutral-400'}`}>
                    {isAtLimit
                      ? 'Upgrade required to publish more properties.'
                      : `${slotsRemaining} publication slot${slotsRemaining === 1 ? '' : 's'} remaining.`}
                  </p>
                </>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-neutral-300 mt-4">
                <div>
                  <p className="text-xs text-neutral-500">Published properties</p>
                  <p className="font-semibold">{publishedCount}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Total properties</p>
                  <p className="font-semibold">{totalProperties}</p>
                </div>
              </div>
            </div>

            {nextPlan && (
              <div className="group relative border border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-purple-600/20 to-blue-600/10 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-neutral-200">Recommended upgrade</p>
                    <p className="text-2xl font-bold">{nextPlan.name}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold border border-white/30 rounded-full bg-white/10">
                    Next plan
                  </span>
                </div>
                <p className="text-sm text-neutral-200 mb-4">{nextPlan.description}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">R{nextPlan.price.toFixed(2)}</span>
                  <span className="text-sm text-neutral-200">/month</span>
                </div>
                <p className="text-sm text-neutral-200 mb-6">
                  {nextPlan.maxProperties === null
                    ? 'Unlimited properties'
                    : `Up to ${nextPlan.maxProperties} properties`}
                </p>
                <button
                  onClick={() => handlePlanSelect(nextPlan.id)}
                  className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30"
                >
                  Upgrade to {nextPlan.name}
                </button>
                <p className="text-xs text-neutral-200 mt-3">
                  {planLimit === null
                    ? 'Already on the highest plan.'
                    : `Currently limited to ${planLimit} published properties.`}
                </p>
              </div>
            )}
          </div>
        )}

          {/* Subscription Management */}
          {(provider.subscriptionToken || subscriptionDetails || provider.billingInfo.isInTrial || provider.billingInfo.subscriptionStatus === 'trial') && subscriptionSummary && (
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-blue-500/10">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">
                Subscription Management
              </h2>
              
              {subscriptionError && (
                <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-300">Error</p>
                    <p className="text-sm text-red-200">{subscriptionError}</p>
                  </div>
                </div>
              )}

              {isLoadingSubscription ? (
                <div className="py-8 text-center">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-neutral-400">Loading subscription details...</p>
                </div>
              ) : subscriptionDetails ? (
                <div className="space-y-6">
                  {/* Subscription Status */}
                  <div className="p-6 border border-white/10 bg-black/30 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold">Subscription Details</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        subscriptionDetails.status === 'active' 
                          ? 'border-green-500/50 bg-green-500/10 text-green-300'
                          : subscriptionDetails.status === 'paused'
                          ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
                          : 'border-red-500/50 bg-red-500/10 text-red-300'
                      }`}>
                        {subscriptionDetails.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-400 mb-1">Amount</p>
                        <p className="font-semibold">R{(subscriptionDetails.amount / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-1">Frequency</p>
                        <p className="font-semibold">
                          {subscriptionDetails.frequency === 3 ? 'Monthly' :
                           subscriptionDetails.frequency === 4 ? 'Quarterly' :
                           subscriptionDetails.frequency === 6 ? 'Annual' : 'Custom'}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-1">Next Billing Date</p>
                        <p className="font-semibold">{new Date(subscriptionDetails.next_run_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-1">Remaining Cycles</p>
                        <p className="font-semibold">{subscriptionDetails.cycles === 0 ? 'Unlimited' : subscriptionDetails.cycles}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleOpenManagementLink}
                      disabled={isGeneratingManagementLink || isManagingSubscription}
                      className="flex items-center gap-2 px-6 py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Open Paystack management page to change card or cancel subscription"
                    >
                      <Settings className="w-4 h-4" />
                      {isGeneratingManagementLink ? 'Opening...' : 'Change card details'}
                    </button>

                    {subscriptionDetails.status !== 'cancelled' && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isManagingSubscription}
                        className="flex items-center gap-2 px-6 py-3 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl text-red-300 hover:bg-red-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        {isManagingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="py-8 text-center">
                    <p className="text-neutral-400">Loading subscription details...</p>
                    <p className="text-sm text-neutral-500 mt-2">If you just made a payment, please wait a moment and refresh the page</p>
                  </div>
                  {/* Show manage button even if subscription details aren't loaded yet */}
                  {(provider.subscriptionToken || provider.billingInfo.isInTrial || provider.billingInfo.subscriptionStatus === 'trial') && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleOpenManagementLink}
                        disabled={isGeneratingManagementLink || isManagingSubscription}
                        className="flex items-center gap-2 px-6 py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Open Paystack management page to change card or cancel subscription"
                      >
                        <Settings className="w-4 h-4" />
                        {isGeneratingManagementLink ? 'Opening...' : 'Change card details'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Billing History */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-blue-500/10">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">
              Billing History
            </h2>
            
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 w-16 h-16 border border-blue-500/30 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-blue-400 opacity-40" />
                </div>
                <p className="text-lg font-medium text-neutral-300">No billing history yet</p>
                <p className="text-sm text-neutral-400 mt-2">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Invoice Selection */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <label className="text-xs sm:text-sm font-medium text-neutral-300 break-words whitespace-nowrap">Select invoice to download:</label>
                  <select
                    value={selectedInvoice?.id || ''}
                    onChange={(e) => {
                      const invoice = invoices.find(inv => inv.id === e.target.value)
                      setSelectedInvoice(invoice || null)
                    }}
                    className="px-3 sm:px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm w-full sm:w-auto min-w-0 flex-1 sm:flex-initial"
                  >
                    <option value="">Choose an invoice...</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.id} - {new Date(invoice.date).toLocaleDateString()} - R{invoice.amount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {selectedInvoice && (
                    <button
                      onClick={() => exportInvoice(selectedInvoice)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 text-xs sm:text-sm w-full sm:w-auto justify-center break-words"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="break-words">Download PDF</span>
                    </button>
                  )}
                </div>

                {/* Invoices Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-2 sm:p-4 text-left text-xs sm:text-sm font-medium text-neutral-300 break-words">Invoice ID</th>
                        <th className="p-2 sm:p-4 text-left text-xs sm:text-sm font-medium text-neutral-300 break-words">Date</th>
                        <th className="p-2 sm:p-4 text-left text-xs sm:text-sm font-medium text-neutral-300 break-words">Description</th>
                        <th className="p-2 sm:p-4 text-left text-xs sm:text-sm font-medium text-neutral-300 break-words">Amount</th>
                        <th className="p-2 sm:p-4 text-left text-xs sm:text-sm font-medium text-neutral-300 break-words">Status</th>
                        <th className="p-2 sm:p-4 text-center text-xs sm:text-sm font-medium text-neutral-300 break-words">Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr 
                          key={invoice.id} 
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedInvoice?.id === invoice.id ? 'bg-blue-500/10' : ''}`}
                        >
                          <td className="p-2 sm:p-4 font-mono text-xs sm:text-sm break-words">{invoice.id}</td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm break-words">{new Date(invoice.date).toLocaleDateString()}</td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-neutral-300 break-words">{invoice.description}</td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm font-semibold break-words">R{invoice.amount.toFixed(2)}</td>
                          <td className="p-2 sm:p-4">
                            <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-medium rounded-full border break-words ${getStatusColor(invoice.status)}`}>
                              {getStatusIcon(invoice.status)}
                              <span className="hidden sm:inline break-words">{invoice.status.toUpperCase()}</span>
                            </span>
                          </td>
                          <td className="p-2 sm:p-4 text-center">
                            <button
                              onClick={() => setSelectedInvoice(invoice)}
                              className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 break-words ${
                                selectedInvoice?.id === invoice.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                              }`}
                            >
                              {selectedInvoice?.id === invoice.id ? 'Selected' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}