"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, CreditCard, AlertCircle } from "lucide-react"

interface PayFastPaymentFormProps {
  amount: number
  userEmail: string
  userName: string
  itemName: string
  customData?: { providerId?: string; subscriptionType?: string; wantsFeatured?: boolean }
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function PayFastPaymentForm({
  amount,
  userEmail,
  userName,
  itemName,
  customData,
  onSuccess,
  onError
}: PayFastPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Request server to create signed PayFast payload (secrets stay server-side)
      const resp = await fetch("/api/payfast/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, userEmail, userName, itemName, customData })
      })

      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        throw new Error(j.error || "Failed to initiate payment")
      }

      const { paymentData } = await resp.json()

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
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Secure Payment
        </CardTitle>
        <CardDescription>
          Complete your payment securely through PayFast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Item:</span>
            <span className="font-medium">{itemName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-lg font-bold text-green-600">
              R {amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* User Information Display */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Customer Details</Label>
          <div className="text-sm">
            <p><strong>Name:</strong> {userName}</p>
            <p><strong>Email:</strong> {userEmail}</p>
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Your payment will be processed securely by PayFast. We never store your payment details.
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay R {amount.toFixed(2)} with PayFast
            </>
          )}
        </Button>

        {/* PayFast Branding */}
        <div className="text-center text-xs text-gray-500">
          Powered by PayFast - Secure Payment Gateway
        </div>
      </CardContent>
    </Card>
  )
}
