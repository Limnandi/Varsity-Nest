"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { CheckCircle, Download, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!paymentDetails) {
    return (
      <AuthGuard requiredRole="provider">
        <DashboardLayout userRole="provider">
          <div className="max-w-2xl mx-auto py-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-red-600">Payment Verification Failed</CardTitle>
                <CardDescription>
                  Unable to verify payment details. Please contact support if you believe this is an error.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/provider/billing")}>
                  Return to Billing
                </Button>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="max-w-2xl mx-auto py-8">
          <Card className="text-center border-green-200">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-green-600 text-2xl">Payment Successful!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for your payment. Your subscription has been activated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Details */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-4">Payment Details</h3>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-sm">{paymentDetails.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-600">R {paymentDetails.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Item:</span>
                    <span className="font-medium">{paymentDetails.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-medium">Completed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-4">What&apos;s Next?</h3>
                <div className="text-left space-y-2 text-sm text-blue-700">
                  <p>✅ Your subscription is now active</p>
                  <p>✅ You can now list and manage accommodations</p>
                  <p>✅ Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleDownloadReceipt} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Receipt
                </Button>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/provider/accommodations" className="flex items-center gap-2">
                    Manage Accommodations
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                A confirmation email has been sent to your registered email address.
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
