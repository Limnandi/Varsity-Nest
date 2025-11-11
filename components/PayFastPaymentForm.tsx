"use client"

import { useState, useRef } from "react"
import { Shield, CreditCard, AlertCircle, User, Mail, CheckCircle } from "lucide-react"
import { generateIdempotencyKey } from "@/lib/utils/idempotency"

interface PayFastPaymentFormProps {
  amount: number
  userEmail: string
  userName: string
  itemName: string
  customData?: { providerId?: string; agentId?: string; subscriptionType?: string; wantsFeatured?: boolean }
  onSuccess?: () => void
  onError?: (error: string) => void
  isEligibleForTrial?: boolean
  isInTrial?: boolean
}

export default function PayFastPaymentForm({
  amount,
  userEmail,
  userName,
  itemName,
  customData,
  onSuccess,
  onError,
  isEligibleForTrial = false,
  isInTrial = false
}: PayFastPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef<string | null>(null)

  const handlePayment = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Generate idempotency key if not already generated for this payment attempt
      if (!idempotencyKeyRef.current) {
        const userId = customData?.providerId || 'unknown'
        idempotencyKeyRef.current = generateIdempotencyKey(userId)
      }

      // Request server to create signed PayFast payload (secrets stay server-side)
      const resp = await fetch("/api/payfast/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          userEmail, 
          userName, 
          itemName, 
          idempotencyKey: idempotencyKeyRef.current,
          customData 
        })
      })

      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        throw new Error(j.error || "Failed to initiate payment")
      }

      const responseData = await resp.json()
      const { paymentData, idempotent, trialActivated, trialPaymentSetup } = responseData

      // Handle trial activation with PayFast redirect
      if (trialActivated && trialPaymentSetup && paymentData) {
        console.log('Trial subscription activated, redirecting to PayFast for payment setup:', responseData)
        // Create form and submit to PayFast to set up recurring payment
        // User will add payment details, but won't be charged until after trial ends
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = process.env.NODE_ENV === 'production' 
          ? 'https://www.payfast.co.za/eng/process' 
          : 'https://sandbox.payfast.co.za/eng/process'

        // Add all payment data as hidden fields
        Object.entries(paymentData).forEach(([key, value]) => {
          if (value != null && String(value) !== '') {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          }
        })

        // Submit form to redirect to PayFast
        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)

        onSuccess?.()
        return
      }

      // Handle trial payment setup (payment scheduled for after trial ends)
      if (trialPaymentSetup && paymentData) {
        // Create form and submit to PayFast to set up recurring payment
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = process.env.NODE_ENV === 'production' 
          ? 'https://www.payfast.co.za/eng/process' 
          : 'https://sandbox.payfast.co.za/eng/process'

        // Add all payment data as hidden fields
        Object.entries(paymentData).forEach(([key, value]) => {
          if (value != null && String(value) !== '') {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          }
        })

        // Submit form
        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)

        onSuccess?.()
        return
      }

      // If idempotent response, use existing payment data
      if (idempotent && paymentData) {
        // Reuse existing idempotency key for subsequent attempts
        console.log('Idempotent payment request - using existing transaction')
      }

      // Create form and submit to PayFast
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = process.env.NODE_ENV === 'production' 
        ? 'https://www.payfast.co.za/eng/process' 
        : 'https://sandbox.payfast.co.za/eng/process'

      // Add all payment data as hidden fields
      Object.entries(paymentData).forEach(([key, value]) => {
        if (value != null && String(value) !== '') {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        }
      })

      // Submit form
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)

      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initialization failed'
      setError(errorMessage)
      onError?.(errorMessage)
      // Reset idempotency key on error so user can retry
      idempotencyKeyRef.current = null
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full space-y-6 text-white">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 border border-green-500/50 bg-green-500/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Secure Payment
            </h3>
            <p className="text-sm text-neutral-400">Complete your payment securely through PayFast</p>
          </div>
        </div>
      </div>

      {/* Payment Amount - Prominent Display */}
      <div className="relative border border-green-500/30 bg-green-500/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-green-500/20">
        <div className="text-center">
          <p className="text-sm text-neutral-300 mb-2">Total Amount</p>
          <p className="text-5xl font-bold text-green-400 mb-1">
            R {amount.toFixed(2)}
          </p>
          <p className="text-xs text-neutral-400">Secure payment via PayFast</p>
        </div>
      </div>

      {/* Customer Information */}
      <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-6">
        <h4 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          Customer Details
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
            <User className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400 mb-1">Name</p>
              <p className="text-sm font-medium text-white truncate">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400 mb-1">Email</p>
              <p className="text-sm font-medium text-white truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="border border-blue-500/30 bg-blue-500/10 backdrop-blur-xl rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-300 mb-1">Secure Payment Processing</p>
          <p className="text-xs text-blue-200">
            Your payment will be processed securely by PayFast. We never store your payment details.
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-300 mb-1">Payment Error</p>
            <p className="text-xs text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>
              {isEligibleForTrial 
                ? 'Activate R0 Trial Subscription' 
                : isInTrial 
                  ? `Set Up Payment (R ${amount.toFixed(2)} after trial)`
                  : `Pay R ${amount.toFixed(2)} with PayFast`}
            </span>
          </>
        )}
      </button>

      {/* PayFast Branding */}
      <div className="text-center">
        <p className="text-xs text-neutral-500 flex items-center justify-center gap-2">
          <CheckCircle className="w-3 h-3" />
          Powered by PayFast - Secure Payment Gateway
        </p>
      </div>
    </div>
  )
}
