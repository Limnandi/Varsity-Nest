"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import PayFastPaymentForm from "@/components/PayFastPaymentForm"
import { ArrowLeft, CreditCard, Shield, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

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
    }
  }
  invoices: any[]
}

export default function AgentPaymentPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    // Payment form will handle the redirect to PayFast
    console.log("Payment initiated successfully")
  }

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error)
    setError(error)
  }

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

          {error && (
            <div className="border border-red-500/50 bg-red-500/10 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-300">Payment Error</p>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
                <PayFastPaymentForm
                  amount={agent.billingInfo.monthlyFee}
                  userEmail={agent.email}
                  userName={agent.contactPerson}
                  itemName={`Varsity Nest Subscription - ${agent.businessName}`}
                  customData={{
                    agentId: agent.id,
                    subscriptionType: "monthly"
                  }}
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
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300">Subscription Plan:</span>
                    <span className="font-semibold text-white">Monthly Subscription</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300">Amount:</span>
                    <span className="text-2xl font-bold text-green-400">
                      R {agent.billingInfo.monthlyFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300">Billing Cycle:</span>
                    <span className="text-white">30 Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300">Next Billing:</span>
                    <span className="text-white">{new Date(agent.billingInfo.nextPaymentDate).toLocaleDateString()}</span>
                  </div>
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
                  <p>• PayFast Wallet</p>
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

