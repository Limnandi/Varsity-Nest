"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import type { Provider } from "@/lib/definitions"
import PayFastPaymentForm from "@/components/PayFastPaymentForm"
import { ArrowLeft, CreditCard, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentPage() {
  const [user, setUser] = useState<Provider | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch user session
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          // Fetch provider data from database
          const providerResponse = await fetch(`/api/provider/billing`, {
            credentials: 'include'
          })
          if (providerResponse.ok) {
            const billingData = await providerResponse.json()
            setUser({
              id: billingData.provider.id,
              user_id: billingData.provider.id,
              business_name: billingData.provider.businessName,
              contact_email: billingData.provider.email,
              contact_person: billingData.provider.contactPerson,
              contact_phone: '',
              address: '',
              is_verified: false,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            })
          } else {
            throw new Error("Failed to fetch provider data")
          }
        } else {
          throw new Error("Authentication required")
        }
      } catch (error) {
        console.error("Session check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const handlePaymentSuccess = () => {
    // Payment form will handle the redirect to PayFast
    console.log("Payment initiated successfully")
  }

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error)
    // You could show a toast notification here
  }

  if (!user || isLoading) {
    return (
      <DashboardLayout userRole="provider">
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Payment Details</h2>
            <p className="text-neutral-300">Please wait while we prepare your payment form...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="provider">
      <div className="space-y-8 p-6 text-white">
        {/* Header */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/20">
          <Link 
            href="/provider/billing" 
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
              <PayFastPaymentForm
                amount={150} // Default monthly fee - replace with actual billing data
                userEmail={user.contact_email}
                userName={user.contact_person}
                itemName="Monthly Subscription"
                customData={{
                  providerId: user.id,
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
                  <span className="font-semibold text-white">Monthly Provider</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Monthly Fee:</span>
                  <span className="text-2xl font-bold text-green-400">
                    R 150.00
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Billing Cycle:</span>
                  <span className="text-white">Monthly</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Next Billing:</span>
                  <span className="text-white">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
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
  )
}
