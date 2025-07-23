"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/definitions"
import { PaymentService, type PaymentMethod } from "@/lib/payments"
import { CreditCard, Plus, Check, AlertCircle, ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

export default function PaymentPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsLoadingUser(false)
    }
    loadUser()
  }, [])
  const [billingInfo, setBillingInfo] = useState({
    monthlyFee: 450,
    nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  })
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCard, setNewCard] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      if (!user) return
      const methods = await PaymentService.getPaymentMethods(user.id)
      setPaymentMethods(methods)
      setSelectedMethod(methods.find((m) => m.isDefault)?.id || methods[0]?.id || "")
    } catch (error) {
      console.error("Failed to load payment methods:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod) return

    setIsProcessing(true)
    try {
      // Create payment intent
      const paymentIntent = await PaymentService.createPaymentIntent(
        billingInfo.monthlyFee * 100, // Convert to cents
      )

      // Confirm payment
      await PaymentService.confirmPayment(paymentIntent.id, selectedMethod)

      alert("Payment successful! Your account has been updated.")
      router.push("/provider/billing")
    } catch (error) {
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddCard = async () => {
    // Simulate adding a new card
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      type: "card",
      last4: newCard.number.slice(-4),
      brand: "visa",
      expiryMonth: Number.parseInt(newCard.expiry.split("/")[0]),
      expiryYear: Number.parseInt("20" + newCard.expiry.split("/")[1]),
      isDefault: paymentMethods.length === 0,
    }

    setPaymentMethods((prev) => [...prev, newMethod])
    setSelectedMethod(newMethod.id)
    setShowAddCard(false)
    setNewCard({ number: "", expiry: "", cvc: "", name: "" })
    setIsLoading(false)
  }

  if (!user) return null

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/provider/billing" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Make Payment</h1>
              <p className="text-gray-600">Complete your monthly subscription payment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Payment Method</h2>
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Card</span>
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedMethod === method.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-6 h-6 text-gray-600" />
                            <div>
                              <p className="font-medium">•••• •••• •••• {method.last4}</p>
                              <p className="text-sm text-gray-600">
                                {method.brand?.toUpperCase()} • Expires {method.expiryMonth}/{method.expiryYear}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {method.isDefault && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Default
                              </span>
                            )}
                            {selectedMethod === method.id && <Check className="w-5 h-5 text-blue-600" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Card Form */}
                {showAddCard && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-4">Add New Card</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={newCard.number}
                          onChange={(e) => setNewCard((prev) => ({ ...prev, number: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={newCard.expiry}
                            onChange={(e) => setNewCard((prev) => ({ ...prev, expiry: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                          <input
                            type="text"
                            placeholder="123"
                            value={newCard.cvc}
                            onChange={(e) => setNewCard((prev) => ({ ...prev, cvc: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Smith"
                          value={newCard.name}
                          onChange={(e) => setNewCard((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleAddCard}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Card
                        </button>
                        <button
                          onClick={() => setShowAddCard(false)}
                          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Secure Payment</h3>
                    <p className="text-sm text-blue-800 mt-1">
                      Your payment information is encrypted and secure. We use industry-standard SSL encryption to
                      protect your data.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm border sticky top-4">
                <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Monthly Subscription</span>
                    <span>R{billingInfo.monthlyFee}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing Fee</span>
                    <span>R0</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">R{billingInfo.monthlyFee}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-sm text-gray-600">
                  <p>• Payment will be processed immediately</p>
                  <p>• Your next billing date: {new Date(billingInfo.nextPayment).toLocaleDateString()}</p>
                  <p>• You can cancel anytime with 30 days notice</p>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={!selectedMethod || isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay R${billingInfo.monthlyFee}`
                  )}
                </button>

                {!selectedMethod && (
                  <div className="mt-3 flex items-center space-x-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Please select a payment method</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
