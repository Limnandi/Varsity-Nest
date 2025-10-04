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
          const sessionData = await response.json()
          
          // Fetch provider data from database
          const providerResponse = await fetch(`/api/providers/${sessionData.userId}`)
          if (providerResponse.ok) {
            const providerData = await providerResponse.json()
            setUser(providerData)
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="provider">
      <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/provider/billing" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Billing
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-600 mt-2">
              Secure your subscription with our trusted payment partner
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
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

            {/* Payment Summary & Security */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription Plan:</span>
                    <span className="font-medium">Monthly Provider</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Fee:</span>
                    <span className="font-bold text-green-600">
                      R 150.00
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billing Cycle:</span>
                    <span>Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Billing:</span>
                    <span>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Security Features
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>PCI DSS compliant</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>No card data stored</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Accepted Payment Methods
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Credit Cards (Visa, Mastercard, American Express)</p>
                  <p>• Debit Cards</p>
                  <p>• EFT (Electronic Funds Transfer)</p>
                  <p>• Instant EFT</p>
                  <p>• PayFast Wallet</p>
                </div>
              </div>

              {/* Support */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Our support team is here to help with any payment questions.
                </p>
                <a 
                  href="mailto:support@varsitynest.co.za" 
                  className="text-sm text-blue-600 hover:underline font-medium"
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
