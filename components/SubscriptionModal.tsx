"use client"

import { useState } from "react"
import { X, CreditCard, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import PayFastPaymentForm from "./PayFastPaymentForm"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  accommodationCount: number
  amount: number
  userEmail: string
  userName: string
  entityId: string
  entityType: "provider" | "agent"
  onPaymentSuccess?: () => void
  isEligibleForTrial?: boolean
  hasUsedTrial?: boolean
  isInTrial?: boolean
  trialEndDate?: string | null
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  accommodationCount,
  amount,
  userEmail,
  userName,
  entityId,
  entityType,
  onPaymentSuccess,
  isEligibleForTrial = false,
  hasUsedTrial: _hasUsedTrial = false,
  isInTrial = false,
  trialEndDate = null
}: SubscriptionModalProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  if (!isOpen) return null

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false)
    onPaymentSuccess?.()
    onClose()
  }

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!showPaymentForm ? (
          <div className="p-8 text-white">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {isEligibleForTrial ? (
                  <div className="w-12 h-12 border border-green-500/50 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                ) : isInTrial ? (
                  <div className="w-12 h-12 border border-blue-500/50 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-blue-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 border border-orange-500/50 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-400" />
                  </div>
                )}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {isEligibleForTrial ? 'Start Your Free Trial' : isInTrial ? 'Trial Active' : 'Subscription Required'}
                </h2>
              </div>
              {isEligibleForTrial ? (
                <p className="text-neutral-300 text-lg">
                  Start with a <span className="font-bold text-green-400">14-day free trial</span> - no payment required!
                </p>
              ) : isInTrial && trialEndDate ? (
                <p className="text-neutral-300 text-lg">
                  Your trial is active. Trial ends on {new Date(trialEndDate).toLocaleDateString()}.
                </p>
              ) : (
                <p className="text-neutral-300 text-lg">
                  You need an active subscription to publish properties on Varsity Nest.
                </p>
              )}
            </div>

            {/* Trial Information Banner */}
            {isEligibleForTrial && (
              <div className="mb-6 p-4 border border-green-500/50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-300 mb-1">14-Day Free Trial Available</h3>
                    <p className="text-sm text-green-200">
                      Start your subscription with a free 14-day trial. No payment required until after the trial period ends.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isInTrial && trialEndDate && (
              <div className="mb-6 p-4 border border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-300 mb-1">Trial Period Active</h3>
                    <p className="text-sm text-blue-200">
                      Your free trial ends on {new Date(trialEndDate).toLocaleDateString()}. 
                      {(() => {
                        const endDate = new Date(trialEndDate)
                        const now = new Date()
                        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        return daysRemaining > 0 ? ` ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining.` : ' Trial has ended.'
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Subscription Pricing</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-neutral-300">First Accommodation</span>
                  </div>
                  <span className="font-bold text-green-400">R 199.90</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                    <span className="text-neutral-300">Each Additional Accommodation</span>
                  </div>
                  <span className="font-bold text-blue-400">R 89.90</span>
                </div>
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-white">Total for {accommodationCount} {accommodationCount === 1 ? 'accommodation' : 'accommodations'}</span>
                    <span className="text-2xl font-bold text-green-400">R {amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-white">What You Get</h3>
              <ul className="space-y-2 text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Publish your properties to reach students</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Reach thousands of students looking for accommodation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Manage all your listings from one dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Priority customer support</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-600/20 border border-gray-500/50 text-white rounded-xl font-semibold hover:bg-gray-600/30 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPaymentForm(true)}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  isEligibleForTrial
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-green-500/20 hover:shadow-green-500/40'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-green-500/20 hover:shadow-green-500/40'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                {isEligibleForTrial ? 'Activate R0 Trial Subscription' : 'Subscribe Now'}
              </button>
            </div>

            {/* Alternative Link */}
            <div className="mt-6 text-center">
              <Link
                href={`/${entityType}/billing`}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors underline"
              >
                Or manage your subscription from the billing page
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-white">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {isEligibleForTrial ? (
                  <div className="w-12 h-12 border border-green-500/50 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                ) : isInTrial ? (
                  <div className="w-12 h-12 border border-blue-500/50 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 border border-green-500/50 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    {isEligibleForTrial ? 'Start Your Free Trial' : isInTrial ? 'Set Up Payment After Trial' : 'Complete Your Subscription'}
                  </h2>
                  <p className="text-neutral-300 text-sm">
                    {isEligibleForTrial 
                      ? 'No payment required - start your 14-day free trial now'
                      : isInTrial 
                        ? 'Payment will be processed automatically after your trial ends'
                        : 'Secure payment through PayFast'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trial Information Banner for Eligible Users */}
            {isEligibleForTrial && (
              <div className="mb-6 p-4 border border-green-500/50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-300 mb-1">14-Day Free Trial</h3>
                    <p className="text-sm text-green-200">
                      Your subscription will start with a free 14-day trial. No payment will be charged until after the trial period ends. 
                      You can cancel anytime during the trial.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trial Information Banner for Active Trial Users */}
            {isInTrial && trialEndDate && (
              <div className="mb-6 p-4 border border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-300 mb-1">Payment Setup for After Trial</h3>
                    <p className="text-sm text-blue-200">
                      Your trial ends on {new Date(trialEndDate).toLocaleDateString()}. 
                      Setting up payment now will ensure your subscription continues seamlessly after the trial period. 
                      No charge until {new Date(trialEndDate).toLocaleDateString()}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Payment Summary</h3>
              <div className="space-y-3">
                {isEligibleForTrial ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <span className="text-neutral-300">Trial Period:</span>
                      <span className="text-2xl font-bold text-green-400">FREE</span>
                    </div>
                    <div className="text-sm text-neutral-400 space-y-1">
                      <p>✓ 14 days free trial - no payment required</p>
                      <p>✓ After trial: R {amount.toFixed(2)}/month</p>
                      <p className="mt-2">Covering {accommodationCount} {accommodationCount === 1 ? 'accommodation' : 'accommodations'}</p>
                    </div>
                  </>
                ) : isInTrial ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <span className="text-neutral-300">Monthly Amount:</span>
                      <span className="text-2xl font-bold text-blue-400">R {amount.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-neutral-400 space-y-1">
                      <p>Payment will be charged after your trial ends on {trialEndDate ? new Date(trialEndDate).toLocaleDateString() : 'trial end date'}</p>
                      <p>This will activate your subscription for 30 days</p>
                      <p className="mt-2">Covering {accommodationCount} {accommodationCount === 1 ? 'accommodation' : 'accommodations'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <span className="text-neutral-300">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-400">R {amount.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-neutral-400">
                      <p>This payment will activate your subscription for 30 days</p>
                      <p className="mt-1">Covering {accommodationCount} {accommodationCount === 1 ? 'accommodation' : 'accommodations'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <PayFastPaymentForm
              amount={amount}
              userEmail={userEmail}
              userName={userName}
              itemName={`Varsity Nest Subscription - ${accommodationCount} ${accommodationCount === 1 ? 'Accommodation' : 'Accommodations'}`}
              customData={{
                [entityType === 'provider' ? 'providerId' : 'agentId']: entityId,
                subscriptionType: 'one-time'
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              isEligibleForTrial={isEligibleForTrial}
              isInTrial={isInTrial}
            />
            <button
              onClick={() => setShowPaymentForm(false)}
              className="mt-4 w-full px-6 py-3 bg-gray-600/20 border border-gray-500/50 text-white rounded-xl font-semibold hover:bg-gray-600/30 transition-all duration-300"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

