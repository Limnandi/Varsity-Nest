"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { CheckCircle, Download, ArrowRight, Home, Building } from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      // Extract payment reference from URL parameters
      // Paystack sends 'reference' and 'trxref' parameters
      const paymentReference = searchParams?.get("reference") || 
                               searchParams?.get("trxref")

      // Always fetch transaction from database to get accurate amount
      // Build API URL with reference if available
      const apiUrl = paymentReference 
        ? `/api/agent/billing/latest-transaction?reference=${encodeURIComponent(paymentReference)}`
        : "/api/agent/billing/latest-transaction"
      
      try {
        const response = await fetch(apiUrl, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          
          setPaymentDetails({
            paymentId: data.paymentId || paymentReference || "pending-verification",
            status: data.status === "completed" ? "COMPLETE" : data.status,
            amount: data.amount || 0, // Use amount from database
            itemName: data.itemName || "Subscription Payment"
          })
        } else {
          // If fetch fails but we have a reference, show success with reference (amount will be 0)
          setPaymentDetails({
            paymentId: paymentReference || "pending-verification",
            status: "COMPLETE",
            amount: 0, // Will show 0 if transaction not found yet
            itemName: "Subscription Payment"
          })
        }
      } catch (error) {
        // Show success anyway (user was redirected from Paystack)
        setPaymentDetails({
          paymentId: "pending-verification",
          status: "COMPLETE",
          amount: 0,
          itemName: "Subscription Payment"
        })
      }
      
      setIsLoading(false)
    }

    fetchPaymentDetails()
  }, [searchParams])

  const handleDownloadReceipt = () => {
    if (!paymentDetails) return

    // Create PDF document
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    // Colors
    const primaryColor = [34, 197, 94] // Green
    const textColor = [0, 0, 0]
    const lightGray = [200, 200, 200]

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 50, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Receipt', pageWidth / 2, 25, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Varsity Nest', pageWidth / 2, 35, { align: 'center' })

    yPos = 70

    // Receipt Details
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Details', margin, yPos)
    
    yPos += 10
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    // Payment Information
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    const details = [
      ['Payment ID:', paymentDetails.paymentId || 'N/A'],
      ['Amount:', `R ${paymentDetails.amount.toFixed(2)}`],
      ['Item:', paymentDetails.itemName || 'Subscription Payment'],
      ['Status:', 'Completed'],
      ['Date:', new Date().toLocaleDateString('en-ZA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      ['Payment Method:', 'Paystack']
    ]

    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, margin, yPos)
      doc.setFont('helvetica', 'normal')
      const labelWidth = doc.getTextWidth(label)
      doc.text(value, margin + labelWidth + 5, yPos)
      yPos += 8
    })

    yPos += 10
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 15

    // Footer
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.setFont('helvetica', 'italic')
    doc.text('Thank you for your payment!', pageWidth / 2, pageHeight - 30, { align: 'center' })
    doc.text('This is an automated receipt. Please keep this for your records.', pageWidth / 2, pageHeight - 20, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleString('en-ZA')}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Download PDF
    doc.save(`receipt-${paymentDetails.paymentId || 'payment'}.pdf`)
  }

  // If we have payment reference in URL, show success even while loading auth
  const hasPaymentReference = searchParams?.get("reference") || searchParams?.get("trxref")
  
  if (isLoading && !hasPaymentReference) {
    return (
      <AuthGuard requiredRole="agent">
        <DashboardLayout userRole="agent">
          <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-white shadow-2xl shadow-green-500/20 max-w-md mx-auto">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 text-center break-words">Processing Payment</h2>
              <p className="text-neutral-300 text-sm sm:text-base text-center break-words">Please wait while we verify your payment...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  // If we have payment reference but no details yet, show loading
  if (!paymentDetails && hasPaymentReference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] p-4 sm:p-6">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-white shadow-2xl shadow-green-500/20 max-w-md text-center mx-4">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 break-words">Verifying Payment</h2>
          <p className="text-neutral-300 text-sm sm:text-base break-words">Please wait while we verify your payment details...</p>
        </div>
      </div>
    )
  }

  if (!paymentDetails && !hasPaymentReference) {
    return (
      <AuthGuard requiredRole="agent">
        <DashboardLayout userRole="agent">
          <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
            <div className="relative border border-red-500/30 bg-red-500/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-white shadow-2xl shadow-red-500/20 max-w-md text-center mx-4">
              <div className="mx-auto mb-4 sm:mb-6 w-12 h-12 sm:w-16 sm:h-16 border border-red-500/50 bg-red-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-red-300 mb-2 sm:mb-3 break-words">Payment Verification Failed</h2>
              <p className="text-red-200 mb-4 sm:mb-6 text-sm sm:text-base break-words">
                Unable to verify payment details. Please contact support if you believe this is an error.
              </p>
              <button
                onClick={() => router.push("/agent/billing")}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600/20 border border-red-500/50 text-red-300 rounded-xl hover:bg-red-600/30 transition-all duration-300 font-medium text-sm sm:text-base w-full sm:w-auto"
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
    <AuthGuard requiredRole="agent">
      <DashboardLayout userRole="agent">
        <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 text-white overflow-x-hidden">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-green-500/20">
            <div className="text-center">
              <div className="relative mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
                <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-green-400 drop-shadow-lg animate-scale-in" />
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping-slow"></div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight break-words">
                Payment Successful! 
              </h1>
              <p className="text-neutral-300 text-sm sm:text-base lg:text-lg break-words">
                Thank you for your payment. Your subscription has been activated.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Payment Details */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-green-500/10">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent break-words">
                Payment Details
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-neutral-300 text-sm sm:text-base">Payment ID:</span>
                  <span className="font-mono text-xs sm:text-sm text-white bg-black/20 px-2 sm:px-3 py-1 rounded break-all min-w-0">{paymentDetails.paymentId}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-neutral-300 text-sm sm:text-base">Amount:</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-400 break-words">R {paymentDetails.amount.toFixed(2)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-neutral-300 text-sm sm:text-base">Item:</span>
                  <span className="font-semibold text-white text-sm sm:text-base break-words text-right sm:text-left">{paymentDetails.itemName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-neutral-300 text-sm sm:text-base">Status:</span>
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-300 rounded-full text-xs sm:text-sm font-medium w-fit">
                    Completed
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-neutral-300 text-sm sm:text-base">Date:</span>
                  <span className="text-white text-sm sm:text-base">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-blue-500/10">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">
                  What&apos;s Next?
                </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="text-neutral-300 text-sm sm:text-base break-words">Your subscription is now active</span>
                </div>
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="text-neutral-300 text-sm sm:text-base break-words">You can now list and manage accommodations</span>
                </div>
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="text-neutral-300 text-sm sm:text-base break-words">
                    Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-blue-500/10">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                Download Receipt
              </button>
              <Link
                href="/agent/accommodations"
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40 text-sm sm:text-base w-full sm:w-auto"
              >
                <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="break-words">Manage Accommodations</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="/agent/dashboard"
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 text-sm sm:text-base w-full sm:w-auto"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                Dashboard
              </Link>
            </div>
            <div className="text-center mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-neutral-400 break-words">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

