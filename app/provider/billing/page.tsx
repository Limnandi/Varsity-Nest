"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { getCurrentUser, type ServiceProvider } from "@/lib/auth"
import { CreditCard, Download } from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"
import "jspdf-autotable"

export default function ProviderBilling() {
  const [user, setUser] = useState<ServiceProvider | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser() as ServiceProvider
    setUser(currentUser)
  }, [])

  const exportInvoice = (invoiceId: string, date: string, amount: number) => {
    if (!user) return

    const doc = new jsPDF()
    doc.setFontSize(22)
    doc.text("Tax Invoice", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.text("Varsity Nest (Pty) Ltd", 14, 40)
    doc.text("123 Tech Avenue, Sandton", 14, 46)
    doc.text("Johannesburg, 2196", 14, 52)
    doc.text("VAT: 4123456789", 14, 58)

    doc.text(`Bill To:`, 14, 80)
    doc.text(user.companyName, 14, 86)
    doc.text(user.name, 14, 92)
    doc.text(user.email, 14, 98)

    doc.text(`Invoice #: ${invoiceId}`, 196, 80, { align: "right" })
    doc.text(`Date: ${date}`, 196, 86, { align: "right" })
    ;(doc as any).autoTable({
      startY: 110,
      head: [["Description", "Quantity", "Unit Price", "Total"]],
      body: [["Varsity Nest Monthly Subscription", "1", `R ${amount.toFixed(2)}`, `R ${amount.toFixed(2)}`]],
      theme: "striped",
    })

    const finalY = (doc as any).lastAutoTable.finalY
    doc.setFontSize(14)
    doc.text(`Total: R ${amount.toFixed(2)}`, 196, finalY + 15, { align: "right" })

    doc.save(`Invoice-${invoiceId}.pdf`)
  }

  if (!user) return null

  const invoices = [
    { id: "INV-2024-003", date: "2024-07-01", amount: 499.0, status: "Paid" },
    { id: "INV-2024-002", date: "2024-06-01", amount: 499.0, status: "Paid" },
    { id: "INV-2024-001", date: "2024-05-01", amount: 499.0, status: "Paid" },
  ]

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
              <p className="text-4xl font-bold text-blue-600">
                R{user.billingInfo.monthlyFee}
                <span className="text-lg font-medium text-gray-500">/month</span>
              </p>
              <p className="text-gray-600 mt-2">Your plan renews on {user.billingInfo.nextPayment}.</p>
              <Link href="/provider/billing/payment">
                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Make Payment
                </button>
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              <div className="flex items-center space-x-4">
                <CreditCard className="w-10 h-10 text-gray-400" />
                <div>
                  <p className="font-medium">PayFast Secure Gateway</p>
                  <p className="text-sm text-gray-500">All major credit cards and EFT supported.</p>
                </div>
              </div>
              <button className="mt-4 w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                Manage Payment Methods
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Billing History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Invoice ID</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{invoice.id}</td>
                      <td className="p-2">{invoice.date}</td>
                      <td className="p-2">R{invoice.amount.toFixed(2)}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportInvoice(invoice.id, invoice.date, invoice.amount)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
