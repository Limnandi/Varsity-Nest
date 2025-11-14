"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { 
  CreditCard, 
  Download, 
  AlertCircle, 
  Calendar, 
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  X,
  Info
} from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"
import "jspdf-autotable"

interface BillingInfo {
  monthlyFee: number
  nextPaymentDate: string
  subscriptionStatus: 'active' | 'inactive' | 'suspended' | 'trial'
  subscriptionStartDate: string
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  description: string
  paymentMethod?: string
}

interface AgentData {
  id: string
  email: string
  businessName: string
  contactPerson: string
  subscriptionToken: string | null
  billingInfo: BillingInfo
}

interface SubscriptionDetails {
  token: string
  status: 'active' | 'paused' | 'cancelled'
  cycles: number
  frequency: number
  amount: number
  item_name: string
  billing_date: string
  next_run_date: string
  is_active: boolean
  is_paused: boolean
  is_cancelled: boolean
}

export default function AgentBilling() {
  const [agent, setAgent] = useState<AgentData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [isManagingSubscription, setIsManagingSubscription] = useState(false)

  const fetchSubscriptionDetails = useCallback(async (token: string) => {
    try {
      setIsLoadingSubscription(true)
      setSubscriptionError(null)
      const response = await fetch(`/api/subscriptions/${token}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to fetch subscription details (${response.status})`)
      }

      const data = await response.json()
      if (data.success && data.subscription) {
        setSubscriptionDetails(data.subscription)
      }
    } catch (err) {
      console.error('Subscription details fetch error:', err)
      setSubscriptionError(err instanceof Error ? err.message : 'Failed to load subscription details')
    } finally {
      setIsLoadingSubscription(false)
    }
  }, [])

  const fetchAgentData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/agent/billing', {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to fetch billing data (${response.status})`)
      }

      const data = await response.json()
      setAgent(data.agent)
      setInvoices(data.invoices || [])
      
      // Fetch subscription details if token exists
      if (data.agent.subscriptionToken) {
        fetchSubscriptionDetails(data.agent.subscriptionToken)
      }
    } catch (err) {
      console.error('Billing data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load billing data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [fetchSubscriptionDetails])

  useEffect(() => {
    fetchAgentData()
  }, [fetchAgentData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchAgentData()
  }

  const handlePauseSubscription = async () => {
    if (!agent?.subscriptionToken) return

    try {
      setIsManagingSubscription(true)
      setSubscriptionError(null)
      const response = await fetch(`/api/subscriptions/${agent.subscriptionToken}/pause`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycles: 0 }) // 0 = indefinite pause
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to pause subscription')
      }

      // Refresh subscription details
      await fetchSubscriptionDetails(agent.subscriptionToken)
      await fetchAgentData() // Refresh billing data
    } catch (err) {
      console.error('Pause subscription error:', err)
      setSubscriptionError(err instanceof Error ? err.message : 'Failed to pause subscription')
    } finally {
      setIsManagingSubscription(false)
    }
  }

  const handleUnpauseSubscription = async () => {
    if (!agent?.subscriptionToken) return

    try {
      setIsManagingSubscription(true)
      setSubscriptionError(null)
      const response = await fetch(`/api/subscriptions/${agent.subscriptionToken}/unpause`, {
        method: 'PUT',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to unpause subscription')
      }

      // Refresh subscription details
      await fetchSubscriptionDetails(agent.subscriptionToken)
      await fetchAgentData() // Refresh billing data
    } catch (err) {
      console.error('Unpause subscription error:', err)
      setSubscriptionError(err instanceof Error ? err.message : 'Failed to unpause subscription')
    } finally {
      setIsManagingSubscription(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!agent?.subscriptionToken) return

    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return
    }

    try {
      setIsManagingSubscription(true)
      setSubscriptionError(null)
      const response = await fetch(`/api/subscriptions/${agent.subscriptionToken}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to cancel subscription')
      }

      // Refresh billing data
      await fetchAgentData()
      setSubscriptionDetails(null)
    } catch (err) {
      console.error('Cancel subscription error:', err)
      setSubscriptionError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setIsManagingSubscription(false)
    }
  }

  const exportInvoice = (invoice: Invoice) => {
    if (!agent) return

    const doc = new jsPDF()
    
    doc.setFontSize(22)
    doc.text("Tax Invoice", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.text("Varsity Nest (Pty) Ltd", 14, 40)
    doc.text("123 Tech Avenue, Sandton", 14, 46)
    doc.text("Johannesburg, 2196", 14, 52)
    doc.text("VAT: 4123456789", 14, 58)

    doc.text("Bill To:", 14, 80)
    doc.text(agent.businessName, 14, 86)
    doc.text(agent.contactPerson, 14, 92)
    doc.text(agent.email, 14, 98)

    doc.text(`Invoice #: ${invoice.id}`, 196, 80, { align: "right" })
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 196, 86, { align: "right" })
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 196, 92, { align: "right" })

    ;(doc as any).autoTable({
      startY: 110,
      head: [["Description", "Quantity", "Unit Price", "Total"]],
      body: [[invoice.description, "1", `R ${invoice.amount.toFixed(2)}`, `R ${invoice.amount.toFixed(2)}`]],
      theme: "striped",
    })

    const finalY = (doc as any).lastAutoTable.finalY
    doc.setFontSize(14)
    doc.text(`Total: R ${invoice.amount.toFixed(2)}`, 196, finalY + 15, { align: "right" })

    doc.setFontSize(10)
    doc.text("Thank you for your business!", 105, finalY + 35, { align: "center" })

    doc.save(`Invoice-${invoice.id}.pdf`)
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'border-green-500/50 bg-green-500/10 text-green-400'
      case 'pending':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
      case 'failed':
        return 'border-red-500/50 bg-red-500/10 text-red-400'
      case 'refunded':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400'
      default:
        return 'border-gray-500/50 bg-gray-500/10 text-gray-400'
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-3 h-3" />
      case 'pending':
        return <Clock className="w-3 h-3" />
      case 'failed':
        return <XCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const getSubscriptionStatusColor = (status: BillingInfo['subscriptionStatus']) => {
    switch (status) {
      case 'active':
        return 'border-green-500/50 bg-green-500/10 text-green-300'
      case 'trial':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-300'
      case 'suspended':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-300'
      case 'inactive':
        return 'border-red-500/50 bg-red-500/10 text-red-300'
      default:
        return 'border-gray-500/50 bg-gray-500/10 text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="agent">
        <DashboardLayout userRole="agent">
          <div className="space-y-6 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="agent">
        <DashboardLayout userRole="agent">
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-4 w-16 h-16 border border-red-500/50 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Billing Data</h2>
              <p className="text-neutral-400 mb-6">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!agent) {
    return null
  }

  const pendingAmount = invoices.reduce((sum, inv) => inv.status === 'pending' ? sum + inv.amount : sum, 0)

  return (
    <AuthGuard requiredRole="agent">
      <DashboardLayout userRole="agent">
        <div className="space-y-8 p-6">
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Billing & Subscriptions
                </h1>
                <p className="text-neutral-300 text-lg">{agent.businessName}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-6 py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group relative border border-white/10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 border border-blue-500/50 bg-blue-500/10 rounded-xl shadow-lg">
                  <DollarSign className="w-6 h-6 text-blue-300" />
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getSubscriptionStatusColor(agent.billingInfo.subscriptionStatus)}`}>
                  {agent.billingInfo.subscriptionStatus.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-neutral-300">Subscription Amount</p>
                <p className="text-4xl font-bold">
                  R{agent.billingInfo.monthlyFee.toFixed(2)}
                  <span className="text-lg font-medium text-neutral-400">/30 days</span>
                </p>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Calendar className="w-4 h-4" />
                  <span>Next payment: {new Date(agent.billingInfo.nextPaymentDate).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-neutral-400">
                    Amount calculated based on your active accommodations
                  </p>
                </div>
              </div>
              <Link href="/agent/billing/payment">
                <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
                  Make Payment
                </button>
              </Link>
            </div>

            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 border border-orange-500/50 bg-orange-500/10 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-neutral-300">Pending Amount</p>
                <p className="text-4xl font-bold">R{pendingAmount.toFixed(2)}</p>
                <p className="text-xs text-neutral-400">{invoices.filter(i => i.status === 'pending').length} pending</p>
              </div>
            </div>
          </div>

          {/* Subscription Management */}
          {agent.subscriptionToken && (
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Subscription Management
              </h2>
              
              {subscriptionError && (
                <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-300">Error</p>
                    <p className="text-sm text-red-200">{subscriptionError}</p>
                  </div>
                </div>
              )}

              {isLoadingSubscription ? (
                <div className="py-8 text-center">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-neutral-400">Loading subscription details...</p>
                </div>
              ) : subscriptionDetails ? (
                <div className="space-y-6">
                  {/* Subscription Status */}
                  <div className="p-6 border border-white/10 bg-black/30 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold">Subscription Details</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        subscriptionDetails.status === 'active' 
                          ? 'border-green-500/50 bg-green-500/10 text-green-300'
                          : subscriptionDetails.status === 'paused'
                          ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
                          : 'border-red-500/50 bg-red-500/10 text-red-300'
                      }`}>
                        {subscriptionDetails.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-400 mb-1">Amount</p>
                        <p className="font-semibold">R{(subscriptionDetails.amount / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-1">Frequency</p>
                        <p className="font-semibold">
                          {subscriptionDetails.frequency === 3 ? 'Monthly' :
                           subscriptionDetails.frequency === 4 ? 'Quarterly' :
                           subscriptionDetails.frequency === 6 ? 'Annual' : 'Custom'}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-1">Next Billing Date</p>
                        <p className="font-semibold">{new Date(subscriptionDetails.next_run_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-1">Remaining Cycles</p>
                        <p className="font-semibold">{subscriptionDetails.cycles === 0 ? 'Unlimited' : subscriptionDetails.cycles}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Actions */}
                  <div className="flex flex-wrap gap-3">
                    {subscriptionDetails.status === 'active' && (
                      <button
                        onClick={handlePauseSubscription}
                        disabled={isManagingSubscription}
                        className="flex items-center gap-2 px-6 py-3 border border-yellow-500/50 bg-yellow-500/10 backdrop-blur-xl rounded-xl text-yellow-300 hover:bg-yellow-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pause className="w-4 h-4" />
                        {isManagingSubscription ? 'Pausing...' : 'Pause Subscription'}
                      </button>
                    )}
                    {subscriptionDetails.status === 'paused' && (
                      <button
                        onClick={handleUnpauseSubscription}
                        disabled={isManagingSubscription}
                        className="flex items-center gap-2 px-6 py-3 border border-green-500/50 bg-green-500/10 backdrop-blur-xl rounded-xl text-green-300 hover:bg-green-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="w-4 h-4" />
                        {isManagingSubscription ? 'Resuming...' : 'Resume Subscription'}
                      </button>
                    )}
                    {subscriptionDetails.status !== 'cancelled' && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isManagingSubscription}
                        className="flex items-center gap-2 px-6 py-3 border border-red-500/50 bg-red-500/10 backdrop-blur-xl rounded-xl text-red-300 hover:bg-red-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        {isManagingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-neutral-400">No active subscription found</p>
                  <p className="text-sm text-neutral-500 mt-2">Subscription details will appear here once you have an active recurring subscription</p>
                </div>
              )}
            </div>
          )}

          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Payment Method
            </h2>
            <div className="flex items-center space-x-4">
              <div className="p-4 border border-purple-500/50 bg-purple-500/10 rounded-xl">
                <CreditCard className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-lg">Paystack Secure Gateway</p>
                <p className="text-sm text-neutral-400">All major credit cards, debit cards, and EFT supported</p>
              </div>
            </div>
            <button className="mt-6 w-full border border-white/20 bg-black/20 backdrop-blur-xl text-white py-3 rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02]">
              Manage Payment Methods
            </button>
          </div>

          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Billing History
            </h2>
            
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 w-16 h-16 border border-blue-500/30 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-blue-400 opacity-40" />
                </div>
                <p className="text-lg font-medium text-neutral-300">No billing history yet</p>
                <p className="text-sm text-neutral-400 mt-2">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <label className="text-sm font-medium text-neutral-300">Select invoice to download:</label>
                  <select
                    value={selectedInvoice?.id || ''}
                    onChange={(e) => {
                      const invoice = invoices.find(inv => inv.id === e.target.value)
                      setSelectedInvoice(invoice || null)
                    }}
                    className="px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose an invoice...</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.id} - {new Date(invoice.date).toLocaleDateString()} - R{invoice.amount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {selectedInvoice && (
                    <button
                      onClick={() => exportInvoice(selectedInvoice)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-4 text-left text-sm font-medium text-neutral-300">Invoice ID</th>
                        <th className="p-4 text-left text-sm font-medium text-neutral-300">Date</th>
                        <th className="p-4 text-left text-sm font-medium text-neutral-300">Description</th>
                        <th className="p-4 text-left text-sm font-medium text-neutral-300">Amount</th>
                        <th className="p-4 text-left text-sm font-medium text-neutral-300">Status</th>
                        <th className="p-4 text-center text-sm font-medium text-neutral-300">Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr 
                          key={invoice.id} 
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedInvoice?.id === invoice.id ? 'bg-blue-500/10' : ''}`}
                        >
                          <td className="p-4 font-mono text-sm">{invoice.id}</td>
                          <td className="p-4 text-sm">{new Date(invoice.date).toLocaleDateString()}</td>
                          <td className="p-4 text-sm text-neutral-300">{invoice.description}</td>
                          <td className="p-4 text-sm font-semibold">R{invoice.amount.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(invoice.status)}`}>
                              {getStatusIcon(invoice.status)}
                              {invoice.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedInvoice(invoice)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                                selectedInvoice?.id === invoice.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                              }`}
                            >
                              {selectedInvoice?.id === invoice.id ? 'Selected' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

