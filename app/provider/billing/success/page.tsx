"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { CheckCircle, Download, ArrowRight, Home, Building } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Extract payment details from URL parameters (guard against null)
    const paymentId = searchParams?.get("pf_payment_id")
    const status = searchParams?.get("payment_status")
    const amount = searchParams?.get("amount_gross")
    const itemName = searchParams?.get("item_name")

    if (paymentId && status === "COMPLETE") {
      setPaymentDetails({
        paymentId,
        status,
        amount: parseFloat(amount || "0"),
        itemName: itemName || "Subscription Payment"
      })
    }
    
    setIsLoading(false)
  }, [searchParams])

  const handleDownloadReceipt = () => {
    // Generate and download receipt
    const receiptData = {
      paymentId: paymentDetails?.paymentId,
      amount: paymentDetails?.amount,
      itemName: paymentDetails?.itemName,
      date: new Date().toLocaleDateString(),
      status: "Completed"
    }

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${paymentDetails?.paymentId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="provider">
        <DashboardLayout userRole="provider">
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-green-500/20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
              <p className="text-neutral-300">Please wait while we verify your payment...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!paymentDetails) {
    return (
      <AuthGuard requiredRole="provider">
        <DashboardLayout userRole="provider">
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="relative border border-red-500/30 bg-red-500/10 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-red-500/20 max-w-md text-center">
              <div className="mx-auto mb-6 w-16 h-16 border border-red-500/50 bg-red-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-300 mb-3">Payment Verification Failed</h2>
              <p className="text-red-200 mb-6">
                Unable to verify payment details. Please contact support if you believe this is an error.
              </p>
              <button
                onClick={() => router.push("/provider/billing")}
                className="px-6 py-3 bg-red-600/20 border border-red-500/50 text-red-300 rounded-xl hover:bg-red-600/30 transition-all duration-300 font-medium"
              >
                Return to Billing
              </button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="space-y-8 p-6 text-white">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-green-500/20">
            <div className="text-center">
              <div className="relative mx-auto mb-6 w-24 h-24">
                <CheckCircle className="w-24 h-24 text-green-400 drop-shadow-lg animate-scale-in" />
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping-slow"></div>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
                Payment Successful! 
              </h1>
              <p className="text-neutral-300 text-lg">
                Thank you for your payment. Your subscription has been activated.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-green-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Payment Details
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Payment ID:</span>
                  <span className="font-mono text-sm text-white bg-black/20 px-3 py-1 rounded">{paymentDetails.paymentId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Amount:</span>
                  <span className="text-2xl font-bold text-green-400">R {paymentDetails.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Item:</span>
                  <span className="font-semibold text-white">{paymentDetails.itemName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Status:</span>
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-300 rounded-full text-sm font-medium">
                    Completed
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Date:</span>
                  <span className="text-white">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  What&apos;s Next?
                </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-neutral-300">Your subscription is now active</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-neutral-300">You can now list and manage accommodations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-neutral-300">
                    Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
              >
                <Download className="w-5 h-5" />
                Download Receipt
              </button>
              <Link
                href="/provider/accommodations"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
              >
                <Building className="w-5 h-5" />
                Manage Accommodations
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/provider/dashboard"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                <Home className="w-5 h-5" />
                Dashboard
              </Link>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-neutral-400">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
