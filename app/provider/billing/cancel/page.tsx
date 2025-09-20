"use client"

import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
        <div className="max-w-2xl mx-auto py-8">
          <Card className="text-center border-red-200">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600 text-2xl">Payment Cancelled</CardTitle>
              <CardDescription className="text-lg">
                Your payment was not completed. No charges were made to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cancellation Details */}
              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-4">Cancellation Details</h3>
                <div className="space-y-3 text-left">
                  {paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-mono text-sm">{paymentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reason:</span>
                    <span className="text-red-600 font-medium">{reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-4">What Happens Next?</h3>
                <div className="text-left space-y-2 text-sm text-yellow-700">
                  <p>No charges were made to your account</p>
                  <p>Your subscription remains unchanged</p>
                  <p>You can try the payment again at any time</p>
                </div>
              </div>

              {/* Common Reasons & Solutions */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-4">Common Reasons for Cancellation</h3>
                <div className="text-left space-y-2 text-sm text-blue-700">
                  <p>• Insufficient funds in your account</p>
                  <p>• Bank declined the transaction</p>
                  <p>• Payment method expired</p>
                  <p>• User cancelled during payment process</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => router.push("/provider/billing")} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Billing
                </Button>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/provider/billing/payment" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Link>
                </Button>
              </div>

              {/* Support Information */}
              <div className="text-sm text-gray-500">
                Need help? Contact our support team at{" "}
                <a href="mailto:support@varsitynest.co.za" className="text-blue-600 hover:underline">
                  support@varsitynest.co.za
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
