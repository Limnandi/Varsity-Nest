"use client"

import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { XCircle, ArrowLeft, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function PaymentCancelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract cancellation details from URL parameters (guard against null)
  const paymentId = searchParams?.get("pf_payment_id") || undefined
  const reason = searchParams?.get("reason") || "Payment was cancelled by the user"

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="space-y-8 p-6 text-white">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-red-500/20">
            <div className="text-center">
              <div className="mx-auto mb-6 w-20 h-20 border border-red-500/50 bg-red-500/10 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
                Payment Cancelled
              </h1>
              <p className="text-neutral-300 text-lg">
                Your payment was not completed. No charges were made to your account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cancellation Details */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-red-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                Cancellation Details
              </h2>
              <div className="space-y-4">
                {paymentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300">Payment ID:</span>
                    <span className="font-mono text-sm text-white bg-black/20 px-3 py-1 rounded">{paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Reason:</span>
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-300 rounded-full text-sm font-medium">
                    {reason}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Date:</span>
                  <span className="text-white">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-yellow-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                What Happens Next?
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-neutral-300">No charges were made to your account</span>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-neutral-300">Your subscription remains unchanged</span>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-neutral-300">You can try the payment again at any time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Common Reasons */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Common Reasons for Cancellation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-neutral-300">Insufficient funds in your account</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-neutral-300">Bank declined the transaction</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-neutral-300">Payment method expired</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-neutral-300">User cancelled during payment process</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/provider/billing")}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Return to Billing
              </button>
              <Link
                href="/provider/billing/payment"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </Link>
              <Link
                href="/provider/dashboard"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
              >
                <Home className="w-5 h-5" />
                Dashboard
              </Link>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-neutral-400">
                Need help? Contact our support team at{" "}
                <a href="mailto:support@varsitynest.co.za" className="text-blue-400 hover:text-blue-300 transition-colors">
                  support@varsitynest.co.za
                </a>
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
